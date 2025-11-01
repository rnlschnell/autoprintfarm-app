import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateApiKey, hashApiKey } from "../utils/crypto.server";
import type {
  CreateDeviceRequest,
  CreateDeviceResponse,
  ListDevicesResponse,
  DeleteDeviceResponse,
} from "../types/device";

/**
 * GET /api/devices - List all devices for the merchant's tenant
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    // Get tenant for this shop
    const tenant = await prisma.tenant.findUnique({
      where: { shopDomain: session.shop },
      include: {
        devices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tenant) {
      return data<ListDevicesResponse>({ devices: [] });
    }

    // Remove apiKeyHash from response
    const devices = tenant.devices.map(({ apiKeyHash, ...device }) => device);

    return data<ListDevicesResponse>({ devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return data<ListDevicesResponse>(
      { devices: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices - Create a new device with API key
 * DELETE /api/devices - Delete/revoke a device
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  if (request.method === "POST") {
    return handleCreateDevice(request, session.shop);
  } else if (request.method === "DELETE") {
    return handleDeleteDevice(request, session.shop);
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Handle POST - Create a new device
 */
async function handleCreateDevice(request: Request, shopDomain: string) {
  try {
    const body: CreateDeviceRequest = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return data<CreateDeviceResponse>(
        {
          device: {} as any,
          message: "Device name is required",
        },
        { status: 400 }
      );
    }

    // Get tenant for this shop
    const tenant = await prisma.tenant.findUnique({
      where: { shopDomain },
    });

    if (!tenant) {
      return data<CreateDeviceResponse>(
        {
          device: {} as any,
          message: "Tenant not connected. Please connect your Print Farm first.",
        },
        { status: 404 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Create device
    const device = await prisma.device.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        apiKeyHash,
        status: "active",
      },
    });

    // Return device with API key (only time it will be shown)
    const { apiKeyHash: _, ...deviceWithoutHash } = device;

    return data<CreateDeviceResponse>({
      device: {
        ...deviceWithoutHash,
        apiKey,
      },
      message: "Device created successfully. Save the API key - it won't be shown again.",
    });
  } catch (error) {
    console.error("Error creating device:", error);
    return data<CreateDeviceResponse>(
      {
        device: {} as any,
        message: "Failed to create device. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle DELETE - Revoke a device
 */
async function handleDeleteDevice(request: Request, shopDomain: string) {
  try {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("id");

    if (!deviceId) {
      return data<DeleteDeviceResponse>(
        {
          success: false,
          message: "Device ID is required",
        },
        { status: 400 }
      );
    }

    // Get tenant for this shop
    const tenant = await prisma.tenant.findUnique({
      where: { shopDomain },
    });

    if (!tenant) {
      return data<DeleteDeviceResponse>(
        {
          success: false,
          message: "Tenant not found",
        },
        { status: 404 }
      );
    }

    // Verify device belongs to this tenant
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        tenantId: tenant.id,
      },
    });

    if (!device) {
      return data<DeleteDeviceResponse>(
        {
          success: false,
          message: "Device not found",
        },
        { status: 404 }
      );
    }

    // Update device status to revoked instead of deleting
    // This preserves historical data
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: "revoked",
        updatedAt: new Date(),
      },
    });

    return data<DeleteDeviceResponse>({
      success: true,
      message: "Device access revoked successfully",
    });
  } catch (error) {
    console.error("Error deleting device:", error);
    return data<DeleteDeviceResponse>(
      {
        success: false,
        message: "Failed to revoke device access. Please try again.",
      },
      { status: 500 }
    );
  }
}
