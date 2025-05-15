import { Application } from "@/types/application";
import { Button } from "../../../ui/button";
import Link from "next/link";
import { useAccount } from "@/hooks/useAccount";
import { AccountRole } from "@/types/account";
import SignRkhTransactionButton from "@/components/sign/SignRkhTransactionButton";
import SignMetaAllocatorTransactionButton from "@/components/sign/SignMetaAllocatorTransactionButton";
import ApproveGovernanceReviewButton from "@/components/sign/ApproveGovernanceReviewButton";
import { useState } from "react";
import { ConnectWalletDialog } from "@/components/connect/ConnectWalletDialog";
import OverrideKYCButton from "@/components/sign/OverrideKYCButton";

interface ActionConfig {
  label: string;
  href?: string;
  disabled?: boolean;
  component?: React.ComponentType<any>;
  connectWallet?: boolean; 
}

function getActionConfig(application: Application, account?: { role: AccountRole }): ActionConfig {
  const { status, id, githubPrNumber } = application;
  let label = ""

  switch (status) {
    case "SUBMISSION_PHASE":
      // If gov team is logged in they can override KYC.
      // If not, the viewer can see the submitted KYC
      if (account?.role === AccountRole.GOVERNANCE_TEAM || account?.role === AccountRole.ADMIN) {
        return {
          label,
          component: OverrideKYCButton,
        };
      } else {
        return {
          label: "View",
          href: `${application.githubPrLink}`,
        };
      }

    case "KYC_PHASE":
      // If gov team is logged in they can override KYC.
      // If not, the viewer can submit KYC
      if (account?.role === AccountRole.GOVERNANCE_TEAM || account?.role === AccountRole.ADMIN) {
        return {
          label,
          component: OverrideKYCButton,
        };
      } else {
        return {
          label: "Submit KYC",
          href: `https://verify.zyphe.com/flow/fil-kyc/kyc/kyc?applicationId=${application.id}`,
        };
      }

    case "GOVERNANCE_REVIEW_PHASE":
      if (account?.role === AccountRole.GOVERNANCE_TEAM || account?.role === AccountRole.ADMIN) {
        return {
          label,
          component: ApproveGovernanceReviewButton,
        };
      }

    case "RKH_APPROVAL_PHASE":
      label = `(${application.rkhApprovals?.length ?? 0}/${application.rkhApprovalsThreshold ?? 2}) Approve`;
      if (account?.role === AccountRole.ROOT_KEY_HOLDER || account?.role === AccountRole.ADMIN) {
        return {
          label,
          component: SignRkhTransactionButton,
        };
      }

    case "META_APPROVAL_PHASE":
        if (account?.role === AccountRole.ROOT_KEY_HOLDER || account?.role === AccountRole.ADMIN) {
          return {
            label: "Approve",
            component: SignMetaAllocatorTransactionButton,
          };
        }
       
    default:
      return {
        label: "Connect Wallet",
        connectWallet: true,
      } as ActionConfig & { connectWallet: true };
  }
}

export function ApplicationActionButton({ application }: { application: Application }) {  
  const { account } = useAccount();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const handleClose = () => setDialogOpen(false);
  const { label, href, disabled, component: Component, connectWallet } = getActionConfig(application, { role: account?.role ?? AccountRole.GUEST });


  return (
    <>
      {Component ? (
        <Component application={application} text={label} />
      ) : connectWallet ? (
        <>
          <Button className="w-[150px]" onClick={() => setDialogOpen(true)}>
            {label}
          </Button>
          <ConnectWalletDialog
            isOpen={isDialogOpen}
            setIsOpen={setDialogOpen}
            handleClose={handleClose}
          />
        </>
      ) : href ? (
        <Button disabled={disabled} className="w-[150px]">
          <Link href={href} target="_blank">
            {label}
          </Link>
        </Button>
      ) : (
        <Button disabled={disabled}>{label}</Button>
      )}
    </>
  );
}
