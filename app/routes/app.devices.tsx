import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // TODO: Fetch devices from database when we add Supabase
  // For now, return mock data
  const devices = [
    // {
    //   id: '1',
    //   name: 'Print Farm #1',
    //   status: 'active',
    //   lastSeen: new Date().toISOString(),
    // }
  ];

  return {
    shopDomain: session.shop,
    devices,
  };
};

export default function Devices() {
  const { shopDomain, devices } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Print Farm Devices">
      <s-button slot="primary-action" variant="primary" disabled>
        Add Device
      </s-button>

      <s-section heading="Connected Devices">
        {devices.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              No devices connected yet. Click "Add Device" to connect your first Raspberry Pi print farm.
            </s-paragraph>
            <s-box padding="large" borderWidth="base" borderRadius="base" background="subdued">
              <s-stack direction="block" gap="base" align="center">
                <s-text variant="heading-md">Ready to Connect Your Print Farm?</s-text>
                <s-paragraph>
                  Once you add a device, you'll receive API credentials to configure your Raspberry Pi.
                  Your Pi will then automatically receive new orders from your Shopify store.
                </s-paragraph>
                <s-button variant="primary" disabled>
                  Add Your First Device
                </s-button>
                <s-text variant="body-sm" tone="subdued">
                  (Device management coming soon - requires database integration)
                </s-text>
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
                      <s-badge tone={device.status === 'active' ? 'success' : 'critical'}>
                        {device.status}
                      </s-badge>
                      <s-text variant="body-sm" tone="subdued">
                        Last seen: {new Date(device.lastSeen).toLocaleString()}
                      </s-text>
                    </s-stack>
                  </s-stack>
                  <s-stack direction="inline" gap="tight">
                    <s-button variant="tertiary" disabled>
                      View Details
                    </s-button>
                    <s-button variant="tertiary" tone="critical" disabled>
                      Revoke Access
                    </s-button>
                  </s-stack>
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
            API credentials are shown only once when created. Store them securely on your Raspberry Pi.
          </s-paragraph>
          <s-paragraph>
            <s-text variant="heading-sm">Status</s-text>
          </s-paragraph>
          <s-paragraph>
            Active devices regularly check for new orders. If a device hasn't been seen recently, it may be offline.
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Coming Soon">
        <s-stack direction="block" gap="base">
          <s-unordered-list>
            <s-list-item>Add and remove devices</s-list-item>
            <s-list-item>Generate API credentials</s-list-item>
            <s-list-item>View device activity logs</s-list-item>
            <s-list-item>Monitor order sync status</s-list-item>
            <s-list-item>Device health monitoring</s-list-item>
          </s-unordered-list>
          <s-text variant="body-sm" tone="subdued">
            These features will be available after adding Supabase database integration.
          </s-text>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
