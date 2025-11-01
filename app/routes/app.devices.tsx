import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState, useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Fetch tenant status and devices
  const baseUrl = new URL(request.url).origin;

  const tenantResponse = await fetch(`${baseUrl}/api/tenant`, {
    headers: { Cookie: request.headers.get("Cookie") || "" },
  });
  const tenantData = await tenantResponse.json();

  const devicesResponse = await fetch(`${baseUrl}/api/devices`, {
    headers: { Cookie: request.headers.get("Cookie") || "" },
  });
  const devicesData = await devicesResponse.json();

  return {
    shopDomain: session.shop,
    tenantStatus: tenantData,
    devices: devicesData.devices || [],
  };
};

export default function Devices() {
  const { shopDomain, tenantStatus, devices: initialDevices } = useLoaderData<typeof loader>();
  const tenantFetcher = useFetcher();
  const deviceFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [newDevice, setNewDevice] = useState<any>(null);
  const [devices, setDevices] = useState(initialDevices);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedTenantId, setCopiedTenantId] = useState(false);

  // Update devices when fetcher returns
  useEffect(() => {
    if (deviceFetcher.data?.device) {
      setNewDevice(deviceFetcher.data.device);
      setShowApiKeyModal(true);
      setShowDeviceModal(false);
      setDeviceName("");
      // Add new device to list
      setDevices((prev: any) => [deviceFetcher.data.device, ...prev]);
    }
  }, [deviceFetcher.data]);

  // Refresh after delete
  useEffect(() => {
    if (deleteFetcher.data?.success) {
      // Refresh devices list
      window.location.reload();
    }
  }, [deleteFetcher.data]);

  const handleTenantConnect = () => {
    tenantFetcher.submit(
      { tenantId },
      { method: "post", action: "/api/tenant", encType: "application/json" }
    );
  };

  const handleCreateDevice = () => {
    deviceFetcher.submit(
      { name: deviceName },
      { method: "post", action: "/api/devices", encType: "application/json" }
    );
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (confirm("Are you sure you want to revoke access for this device? This cannot be undone.")) {
      deleteFetcher.submit(
        {},
        { method: "delete", action: `/api/devices?id=${deviceId}` }
      );
    }
  };

  const copyToClipboard = (text: string, type: "apiKey" | "tenantId") => {
    navigator.clipboard.writeText(text);
    if (type === "apiKey") {
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    } else {
      setCopiedTenantId(true);
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const maskTenantId = (id: string) => {
    const parts = id.split("-");
    if (parts.length === 5) {
      return `${parts[0]}-****-****-****-********${parts[4].slice(-4)}`;
    }
    return id;
  };

  // Show tenant connection screen if not connected
  if (!tenantStatus.connected) {
    return (
      <s-page heading="Print Farm Devices">
        <s-section heading="Connect Your Print Farm">
          <s-stack direction="block" gap="large">
            <s-paragraph>
              Before you can manage devices, you need to connect your Print Farm to this Shopify store.
            </s-paragraph>

            <s-box padding="large" borderWidth="base" borderRadius="base" background="subdued">
              <s-stack direction="block" gap="base">
                <s-text variant="heading-md">Get Your Tenant ID</s-text>

                <s-ordered-list>
                  <s-list-item>
                    Log into your Raspberry Pi Print Farm at http://192.168.4.45:8080
                  </s-list-item>
                  <s-list-item>
                    Navigate to the Orders page
                  </s-list-item>
                  <s-list-item>
                    Click the "Shopify" tab
                  </s-list-item>
                  <s-list-item>
                    Click the green "Connect Shopify" button
                  </s-list-item>
                  <s-list-item>
                    Copy your Tenant ID from the modal
                  </s-list-item>
                  <s-list-item>
                    Paste it below
                  </s-list-item>
                </s-ordered-list>

                <s-stack direction="block" gap="tight">
                  <s-text variant="heading-sm">Enter Tenant ID</s-text>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="f448c280-3009-4120-b701-9f25b5e78ebb"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      fontFamily: "monospace",
                    }}
                  />
                </s-stack>

                {tenantFetcher.data?.message && (
                  <s-banner
                    tone={tenantFetcher.data.success ? "success" : "critical"}
                  >
                    {tenantFetcher.data.message}
                  </s-banner>
                )}

                <s-button
                  variant="primary"
                  onClick={handleTenantConnect}
                  disabled={!tenantId || tenantFetcher.state === "submitting"}
                >
                  {tenantFetcher.state === "submitting" ? "Connecting..." : "Connect Print Farm"}
                </s-button>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>

        <s-section slot="aside" heading="What is a Tenant ID?">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Your Tenant ID is a unique identifier for your Print Farm instance. It's automatically
              assigned when you set up your Raspberry Pi.
            </s-paragraph>
            <s-paragraph>
              This ID allows us to securely link your Shopify orders to your Print Farm without
              exposing any sensitive credentials.
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  // Show device management UI if tenant is connected
  return (
    <s-page heading="Print Farm Devices">
      <s-button slot="primary-action" variant="primary" onClick={() => setShowDeviceModal(true)}>
        Add Device
      </s-button>

      <s-section heading="Connected Devices">
        <s-stack direction="block" gap="tight">
          <s-text variant="body-sm" tone="subdued">
            Tenant ID: {maskTenantId(tenantStatus.tenant.id)}
            <button
              onClick={() => copyToClipboard(tenantStatus.tenant.id, "tenantId")}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
                background: copiedTenantId ? "#008060" : "#f0f0f0",
                color: copiedTenantId ? "white" : "black",
                border: "none",
                borderRadius: "4px",
              }}
            >
              {copiedTenantId ? "Copied!" : "Copy"}
            </button>
          </s-text>
        </s-stack>

        {devices.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              No devices connected yet. Click "Add Device" to connect your first Raspberry Pi print farm.
            </s-paragraph>
            <s-box padding="large" borderWidth="base" borderRadius="base" background="subdued">
              <s-stack direction="block" gap="base" align="center">
                <s-text variant="heading-md">Ready to Connect a Device?</s-text>
                <s-paragraph>
                  Each device gets a unique API key to securely access your Shopify orders.
                </s-paragraph>
                <s-button variant="primary" onClick={() => setShowDeviceModal(true)}>
                  Add Your First Device
                </s-button>
              </s-stack>
            </s-box>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base">
            {devices.map((device: any) => (
              <s-box key={device.id} padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="inline" gap="base" align="space-between">
                  <s-stack direction="block" gap="tight">
                    <s-text variant="heading-sm">{device.name}</s-text>
                    <s-stack direction="inline" gap="tight">
                      <s-badge tone={device.status === "active" ? "success" : "critical"}>
                        {device.status}
                      </s-badge>
                      {device.lastSeenAt && (
                        <s-text variant="body-sm" tone="subdued">
                          Last seen: {new Date(device.lastSeenAt).toLocaleString()}
                        </s-text>
                      )}
                    </s-stack>
                    <s-text variant="body-sm" tone="subdued">
                      Created: {new Date(device.createdAt).toLocaleDateString()}
                    </s-text>
                  </s-stack>
                  {device.status === "active" && (
                    <s-button
                      variant="tertiary"
                      tone="critical"
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      Revoke Access
                    </s-button>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="About Devices">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Each Raspberry Pi print farm needs unique API credentials to securely access your orders.
          </s-paragraph>
          <s-paragraph>
            <s-text variant="heading-sm">Security</s-text>
          </s-paragraph>
          <s-paragraph>
            API keys are shown only once when created. Store them securely on your Raspberry Pi.
          </s-paragraph>
          <s-paragraph>
            <s-text variant="heading-sm">Status</s-text>
          </s-paragraph>
          <s-paragraph>
            Active devices can access orders. Revoked devices cannot access anything.
          </s-paragraph>
        </s-stack>
      </s-section>

      {/* Add Device Modal */}
      {showDeviceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeviceModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <s-stack direction="block" gap="base">
              <s-text variant="heading-lg">Add New Device</s-text>

              <s-stack direction="block" gap="tight">
                <s-text variant="heading-sm">Device Name</s-text>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Workshop Pi #1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                />
              </s-stack>

              {deviceFetcher.data?.message && !deviceFetcher.data?.success && (
                <s-banner tone="critical">{deviceFetcher.data.message}</s-banner>
              )}

              <s-stack direction="inline" gap="tight">
                <s-button
                  variant="primary"
                  onClick={handleCreateDevice}
                  disabled={!deviceName || deviceFetcher.state === "submitting"}
                >
                  {deviceFetcher.state === "submitting" ? "Creating..." : "Create Device"}
                </s-button>
                <s-button variant="tertiary" onClick={() => setShowDeviceModal(false)}>
                  Cancel
                </s-button>
              </s-stack>
            </s-stack>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && newDevice && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
            }}
          >
            <s-stack direction="block" gap="base">
              <s-text variant="heading-lg">Device Created Successfully!</s-text>

              <s-banner tone="attention">
                <s-stack direction="block" gap="tight">
                  <s-text variant="body-md">
                    <strong>Save this API key now!</strong> For security reasons, it won't be shown again.
                  </s-text>
                </s-stack>
              </s-banner>

              <s-stack direction="block" gap="tight">
                <s-text variant="heading-sm">Device Name</s-text>
                <s-text variant="body-md">{newDevice.name}</s-text>
              </s-stack>

              <s-stack direction="block" gap="tight">
                <s-text variant="heading-sm">API Key</s-text>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "12px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    wordBreak: "break-all",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {newDevice.apiKey}
                </div>
                <s-button
                  variant="primary"
                  onClick={() => copyToClipboard(newDevice.apiKey, "apiKey")}
                >
                  {copiedApiKey ? "Copied!" : "Copy API Key"}
                </s-button>
              </s-stack>

              <s-stack direction="block" gap="tight">
                <s-text variant="heading-sm">Next Steps</s-text>
                <s-ordered-list>
                  <s-list-item>Copy the API key above</s-list-item>
                  <s-list-item>Open your Raspberry Pi Print Farm</s-list-item>
                  <s-list-item>Go to Settings → Integrations</s-list-item>
                  <s-list-item>Paste the API key</s-list-item>
                  <s-list-item>Your device will start receiving orders automatically</s-list-item>
                </s-ordered-list>
              </s-stack>

              <s-button
                variant="primary"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setNewDevice(null);
                }}
              >
                Done
              </s-button>
            </s-stack>
          </div>
        </div>
      )}
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
