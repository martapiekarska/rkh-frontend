"use client";

import { governanceReview } from "@/lib/api";
import { useEffect, useState } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useWriteContract, useWaitForTransactionReceipt, useAccount as useAccountWagmi, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SimpleSelect} from "@/components/ui/SimpleSelect";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAccount } from "@/hooks";
import { Application } from "@/types/application";

interface ApproveGovernanceReviewButtonProps {
    application: Application;
}

export default function ApproveGovernanceReviewButton({ application }: ApproveGovernanceReviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const { account } = useAccount();
    const { toast } = useToast();
    const [ realDataCap, setRealDataCap ] = useState(application.datacap);
    const [ allocatorType, setAllocatorType ] = useState("Automated");
    const [ approvalSecret, setApprovalSecret ] = useState("");
    const [ rejectReason, setRejectReason ] = useState("No reason given");

    const { writeContract, isPending, error: isError, data: hash, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash,
    })

    const handleOpenChange = (open: boolean) => {
        reset();
        setIsOpen(open);
    };

    useEffect(() => {
        if (isConfirming) {
            toast({
                title: "Transaction submitted",
                description: `${hash}`,
                variant: "default",
            });
            handleOpenChange(false);
        }

        if (isError) {
            toast({
                title: "Error",
                description: "Failed to submit transaction",
                variant: "destructive",
            });
            handleOpenChange(false);
        }
    }, [isError, isConfirming]);

    const submitReview = async (approved: boolean) => {
        let data = {}

        if (approved) {
            data = {
              result: "approved",
              details: {
                finalDataCap: realDataCap,
                allocatorType: allocatorType,
                reviewerAddress: account?.address || "0x0000000000000000000000000000000000000000"
              }
            }
        } else {
          data = {
            result: "rejected",
            details: {
              reason: rejectReason,
              reviewerAddress: account?.address || "0x0000000000000000000000000000000000000000"
            }
          }
        }

        governanceReview(application.id, approvalSecret, data)
    }

    const approveReview = async () => {
      await submitReview(true); 
    }

    const rejectReview = async () => {
      await submitReview(false); 
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <Button
                className="w-[150px]"
                onClick={() => setIsOpen(true)}
            >
                Approve
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Application</DialogTitle>
                    <DialogDescription>
                        Approve Application on behalf of the Governance Team.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex justify-center items-center p-8">
                    {isPending && <ScaleLoader />}
                    {isConfirming && <p>Confirming transaction...</p>}
                    {isConfirmed && <p>Transaction confirmed!</p>}

                    {!isPending && (
                      <div className="flex justify-center">
                        <Label>
                          {`Approving ${application.name} for ${realDataCap} PiBs.\n\nConfirm PiB amount and allocator type then enter your secret to approve.`}
                        </Label>
                      </div>
                    )}
                    
                </div>

                <div className="flex justify-center">
                <Input
                      type="number"
                      className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                      placeholder={application.datacap.toString()}
                      onChange={(e) => setRealDataCap(e.target.valueAsNumber)}
                    />
                </div>

                <div className="flex justify-center">
                  <SimpleSelect 
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                    onChange={(e) => setAllocatorType(e.target.value)}
                    >
                    <option value="Automated">Automated</option>
                    <option value="Market Based">Market Based</option>
                    <option value="Manual">Manual</option>
                  </SimpleSelect>
                </div>

                <div className="flex justify-center">
                <Input
                      type="password"
                      className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                      placeholder="secret"
                      onChange={(e) => setApprovalSecret(e.target.value)}
                    />
                </div>

                <div className="flex justify-center gap-2">
                    <Button className="w-[150px]" disabled={isPending} onClick={approveReview}>
                        {isPending ? "Approving..." : "APPROVE"}
                    </Button>
                    <Button className="w-[150px]" disabled={isPending} onClick={rejectReview}>
                        {isPending ? "Submitting..." : "REJECT"}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}