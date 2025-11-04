import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Get shop information
  const shopResponse = await admin.graphql(
    `#graphql
      query {
        shop {
          name
          email
          plan {
            displayName
          }
          currencyCode
        }
      }
    `
  );

  const shopData = await shopResponse.json();

  // Get order count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ordersResponse = await admin.graphql(
    `#graphql
      query($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
    {
      variables: {
        query: `created_at:>=${thirtyDaysAgo.toISOString().split('T')[0]}`
      }
    }
  );

  const ordersData = await ordersResponse.json();

  // Get real device count from database
  const tenant = await prisma.tenant.findUnique({
    where: { shopDomain: session.shop },
    include: {
      devices: {
        where: { status: "active" },
      },
    },
  });

  return {
    shop: shopData.data?.shop,
    shopDomain: session.shop,
    deviceCount: tenant?.devices?.length || 0,
    orderCount: ordersData.data?.orders?.edges?.length || 0,
    tenantConnected: !!tenant,
  };
};

export default function Index() {
  const { shop, shopDomain, deviceCount, orderCount, tenantConnected } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Dashboard">
      {!tenantConnected && (
        <s-section>
          <s-banner tone="info">
            <s-text variant="body-md">
              Welcome to AutoPrintFarm! To get started, connect your Print Farm by clicking the "Devices" tab and entering your Tenant ID.
            </s-text>
          </s-banner>
        </s-section>
      )}

      <s-section heading="Quick Stats">
        <s-stack direction="inline" gap="base">
          <s-box padding="large" borderWidth="base" borderRadius="base" style={{ flex: 1, minWidth: "200px" }}>
            <s-stack direction="block" gap="tight" align="start">
              <s-text variant="body-sm" tone="subdued">Connected Devices</s-text>
              <s-text variant="heading-xl">{deviceCount}</s-text>
              {!tenantConnected && (
                <s-text variant="body-sm" tone="subdued">Connect your Print Farm to add devices</s-text>
              )}
            </s-stack>
          </s-box>

          <s-box padding="large" borderWidth="base" borderRadius="base" style={{ flex: 1, minWidth: "200px" }}>
            <s-stack direction="block" gap="tight" align="start">
              <s-text variant="body-sm" tone="subdued">Orders (Last 30 Days)</s-text>
              <s-text variant="heading-xl">{orderCount}</s-text>
              <s-text variant="body-sm" tone="subdued">Automatic order sync coming soon</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Store Information">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="large">
              <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                <s-text variant="body-sm" tone="subdued">Store Name</s-text>
                <s-text variant="body-md">{shop?.name || shopDomain}</s-text>
              </s-stack>
              <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                <s-text variant="body-sm" tone="subdued">Email</s-text>
                <s-text variant="body-md">{shop?.email}</s-text>
              </s-stack>
            </s-stack>
            <s-stack direction="inline" gap="large">
              <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                <s-text variant="body-sm" tone="subdued">Plan</s-text>
                <s-text variant="body-md">{shop?.plan?.displayName}</s-text>
              </s-stack>
              <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
                <s-text variant="body-sm" tone="subdued">Currency</s-text>
                <s-text variant="body-md">{shop?.currencyCode}</s-text>
              </s-stack>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Get Started">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Follow these steps to connect your Raspberry Pi print farm:
          </s-paragraph>
          <s-ordered-list>
            <s-list-item>
              Navigate to the Devices page using the menu
            </s-list-item>
            <s-list-item>
              Enter your Print Farm Tenant ID to connect
            </s-list-item>
            <s-list-item>
              Add one or more devices and copy their API keys
            </s-list-item>
            <s-list-item>
              Configure each Raspberry Pi with its unique API key
            </s-list-item>
          </s-ordered-list>
          <s-button href="/app/devices" variant="primary">
            Go to Devices
          </s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="How It Works">
        <s-stack direction="block" gap="base">
          <s-box padding="base" borderRadius="base" background="subdued">
            <s-stack direction="block" gap="tight">
              <s-text variant="heading-sm">1. Connect Print Farm</s-text>
              <s-paragraph>
                Link your Raspberry Pi Print Farm to your Shopify store using your unique Tenant ID.
              </s-paragraph>
            </s-stack>
          </s-box>

          <s-box padding="base" borderRadius="base" background="subdued">
            <s-stack direction="block" gap="tight">
              <s-text variant="heading-sm">2. Add Devices</s-text>
              <s-paragraph>
                Generate secure API credentials for each Raspberry Pi device you want to connect.
              </s-paragraph>
            </s-stack>
          </s-box>

          <s-box padding="base" borderRadius="base" background="subdued">
            <s-stack direction="block" gap="tight">
              <s-text variant="heading-sm">3. Automatic Sync</s-text>
              <s-paragraph>
                Your Pi devices will automatically poll for new orders and begin printing.
              </s-paragraph>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Need Help?">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Visit our documentation for detailed setup guides and troubleshooting tips.
          </s-paragraph>
          <s-button href="https://github.com/rnlschnell/autoprintfarm-app" target="_blank">
            View Documentation
          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
