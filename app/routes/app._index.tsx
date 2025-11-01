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
  const { shop, shopDomain, deviceCount, orderCount } = useLoaderData<typeof loader>();

  return (
    <s-page heading="AutoPrintFarm Dashboard">
      <s-section heading="Welcome to AutoPrintFarm">
        <s-paragraph>
          Connect your Raspberry Pi 3D print farms to automatically receive orders from your Shopify store.
        </s-paragraph>
      </s-section>

      <s-section heading="Store Information">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text variant="heading-sm">Store Name:</s-text>
            <s-text>{shop?.name || shopDomain}</s-text>
          </s-stack>
          <s-stack direction="inline" gap="base">
            <s-text variant="heading-sm">Email:</s-text>
            <s-text>{shop?.email}</s-text>
          </s-stack>
          <s-stack direction="inline" gap="base">
            <s-text variant="heading-sm">Plan:</s-text>
            <s-text>{shop?.plan?.displayName}</s-text>
          </s-stack>
          <s-stack direction="inline" gap="base">
            <s-text variant="heading-sm">Currency:</s-text>
            <s-text>{shop?.currencyCode}</s-text>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="Quick Stats">
        <s-stack direction="block" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="tight">
              <s-text variant="heading-lg">{deviceCount}</s-text>
              <s-text>Connected Print Farm Devices</s-text>
            </s-stack>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="tight">
              <s-text variant="heading-lg">{orderCount}</s-text>
              <s-text>Orders (Last 30 Days)</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Get Started">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            To connect your Raspberry Pi print farm:
          </s-paragraph>
          <s-unordered-list>
            <s-list-item>
              Click "Devices" in the navigation menu
            </s-list-item>
            <s-list-item>
              Click "Add Print Farm Device"
            </s-list-item>
            <s-list-item>
              Copy the generated API credentials
            </s-list-item>
            <s-list-item>
              Configure your Raspberry Pi with these credentials
            </s-list-item>
          </s-unordered-list>
          <s-button href="/app/devices" variant="primary">
            Manage Devices
          </s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="How It Works">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text variant="heading-sm">1. Install App</s-text>
          </s-paragraph>
          <s-paragraph>
            Install this app in your Shopify store to enable order synchronization.
          </s-paragraph>

          <s-paragraph>
            <s-text variant="heading-sm">2. Connect Devices</s-text>
          </s-paragraph>
          <s-paragraph>
            Generate API credentials for each Raspberry Pi print farm you want to connect.
          </s-paragraph>

          <s-paragraph>
            <s-text variant="heading-sm">3. Automatic Sync</s-text>
          </s-paragraph>
          <s-paragraph>
            Your Pi devices will automatically receive new orders and can start printing.
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Need Help?">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Visit our documentation for setup guides and troubleshooting.
          </s-paragraph>
          <s-button href="https://github.com/yourusername/autoprintfarm" target="_blank" variant="tertiary">
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
