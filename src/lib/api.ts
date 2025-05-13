import { env, testApplications } from "@/config/environment";
import { AccountRole } from "@/types/account";
import { ApplicationsResponse } from "@/types/application";

/**
 * API base URL for fetching applications.
 */
const API_BASE_URL = env.apiBaseUrl;

/**
 * Fetches applications based on search criteria and pagination.
 *
 * @param {string} searchTerm - The search term to filter applications
 * @param {string[]} filters - Array of phase filters to apply
 * @param {number} page - The page number for pagination
 * @param {number} pageLimit - The number of items per page
 * @returns {Promise<ApplicationsResponse>} A promise that resolves to the applications response
 * @throws {Error} If the fetch request fails
 */
export async function fetchApplications(
  searchTerm: string,
  filters: string[],
  page: number,
  pageLimit: number
): Promise<ApplicationsResponse> {
  if (env.useTestData) {
    return {
      applications: testApplications,
      totalCount: testApplications.length,
    };
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: pageLimit.toString(),
  });

  filters.forEach((filter) => params.append("status[]", filter));

  if (searchTerm) {
    params.append("search", searchTerm);
  }

  const url = `${API_BASE_URL}/applications?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      applications: result.data.results
        .map((allocator: any) => {
          try {
            const datacap = allocator?.applicationInstructions?.amount ? allocator?.applicationInstructions?.amount : allocator?.datacap;
            const githubWebLink = allocator.applicationDetails?.pullRequestUrl ? 
              allocator.applicationDetails?.pullRequestUrl.replace('api.github.com/repos', 'github.com').replace('/pulls/', '/pull/') :
              '#'
              
            return {
              id: allocator.id,
              number: allocator.number,
              name: allocator.name,
              organization: allocator.organization,
              address: allocator.address,
              github: allocator.github,
              country: allocator.location?.[0] || "Unknown",
              region: allocator.location?.[1] || "Unknown",
              type: allocator.type,
              datacap: datacap,
              createdAt: allocator.createdAt || "2021-09-01T00:00:00.000Z",
              status: allocator.status,
              actorId: allocator.actorId,
              githubPrLink: githubWebLink,
              githubPrNumber: allocator.applicationDetails?.pullRequestNumber,
              rkhApprovals: allocator.rkhPhase?.approvals,
              rkhApprovalsThreshold: allocator.rkhPhase?.approvalsThreshold,
              rkhMessageId: allocator.rkhPhase?.messageId,
              applicationInstructions: allocator.applicationInstructions,
            };
          } catch (error) {
            console.error("Error processing application:", error);
            return null;
          }
        })
        .filter((application: any): application is NonNullable<typeof application> => application !== null),
      totalCount: result.data.pagination.totalItems,
    };
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    throw new Error("Failed to fetch applications");
  }
}

export async function fetchRole(address: string): Promise<AccountRole> {
  if (env.useTestData) {
    return AccountRole.ADMIN;
  }

  const url = `${API_BASE_URL}/roles?address=${address}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result.data.role;
  } catch (error) {
    console.error("Failed to fetch role:", error);
    throw new Error("Failed to fetch role");
  }
}

/* Note: This function is the one that allows a Governance Team member to override
 * KYC and approve an application, NOT the webhook for the formal KYC app */
export async function overrideKYC(id: string, payload: any) {
  const url = `${API_BASE_URL}/applications/${id}/approveKYC`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  } catch (error) {
    console.error("Failed to approve KYC:", error);
    throw new Error("Failed to approve KYC");
  }
}

export async function governanceReview(id: string, payload: any) {
  const url = `${API_BASE_URL}/applications/${id}/approveGovernanceReview`;
  console.log(payload)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  } catch (error) {
    console.error("Failed to submit Governance Review:", error);
    throw new Error("Failed to submit Governance Review");
  }
}
