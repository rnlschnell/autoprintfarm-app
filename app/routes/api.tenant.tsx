import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type {
  ConnectTenantRequest,
  ConnectTenantResponse,
  TenantStatusResponse,
} from "../types/device";

/**
 * GET /api/tenant - Check tenant connection status
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { shopDomain: session.shop },
      include: {
        devices: {
          where: { status: "active" },
        },
      },
    });

    if (!tenant) {
      return data<TenantStatusResponse>({
        connected: false,
      });
    }

    return data<TenantStatusResponse>({
      connected: true,
      tenant: {
        id: tenant.id,
        shopDomain: tenant.shopDomain,
        deviceCount: tenant.devices.length,
      },
    });
  } catch (error) {
    console.error("Error checking tenant status:", error);
    return data<TenantStatusResponse>(
      { connected: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenant - Connect a tenant ID to this shop
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body: ConnectTenantRequest = await request.json();
    const { tenantId } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return data<ConnectTenantResponse>(
        {
          success: false,
          message: "Invalid tenant ID provided",
        },
        { status: 400 }
      );
    }

    // Validate tenant ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return data<ConnectTenantResponse>(
        {
          success: false,
          message: "Tenant ID must be a valid UUID",
        },
        { status: 400 }
      );
    }

    // TODO: In production, validate tenant exists in Supabase
    // For now, we'll trust the tenant ID provided by the user
    // since they got it from their Pi which already validated it

    // Check if this shop is already connected to a different tenant
    const existingTenant = await prisma.tenant.findUnique({
      where: { shopDomain: session.shop },
    });

    if (existingTenant) {
      if (existingTenant.id === tenantId) {
        return data<ConnectTenantResponse>({
          success: true,
          message: "Shop is already connected to this tenant",
          tenant: {
            id: existingTenant.id,
            shopDomain: existingTenant.shopDomain,
            connectedAt: existingTenant.connectedAt,
          },
        });
      }

      // Update existing tenant connection
      const updatedTenant = await prisma.tenant.update({
        where: { shopDomain: session.shop },
        data: { id: tenantId },
      });

      return data<ConnectTenantResponse>({
        success: true,
        message: "Tenant connection updated successfully",
        tenant: {
          id: updatedTenant.id,
          shopDomain: updatedTenant.shopDomain,
          connectedAt: updatedTenant.connectedAt,
        },
      });
    }

    // Create new tenant connection
    const tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        shopDomain: session.shop,
      },
    });

    return data<ConnectTenantResponse>({
      success: true,
      message: "Tenant connected successfully",
      tenant: {
        id: tenant.id,
        shopDomain: tenant.shopDomain,
        connectedAt: tenant.connectedAt,
      },
    });
  } catch (error: any) {
    console.error("Error connecting tenant:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      return data<ConnectTenantResponse>(
        {
          success: false,
          message: "This tenant ID is already connected to another shop",
        },
        { status: 409 }
      );
    }

    return data<ConnectTenantResponse>(
      {
        success: false,
        message: "Failed to connect tenant. Please try again.",
      },
      { status: 500 }
    );
  }
}
