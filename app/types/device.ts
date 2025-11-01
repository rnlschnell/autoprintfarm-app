// Device types for AutoPrintFarm

export interface Device {
  id: string;
  tenantId: string;
  name: string;
  apiKeyHash: string;
  status: "active" | "revoked";
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceWithApiKey extends Omit<Device, "apiKeyHash"> {
  apiKey: string; // Only available immediately after creation
}

export interface CreateDeviceRequest {
  name: string;
}

export interface CreateDeviceResponse {
  device: DeviceWithApiKey;
  message: string;
}

export interface ListDevicesResponse {
  devices: Omit<Device, "apiKeyHash">[];
}

export interface DeleteDeviceResponse {
  success: boolean;
  message: string;
}

export interface ConnectTenantRequest {
  tenantId: string;
}

export interface ConnectTenantResponse {
  success: boolean;
  message: string;
  tenant?: {
    id: string;
    shopDomain: string;
    connectedAt: Date;
  };
}

export interface TenantStatusResponse {
  connected: boolean;
  tenant?: {
    id: string;
    shopDomain: string;
    deviceCount: number;
  };
}
