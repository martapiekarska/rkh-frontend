"use client";

import { overrideKYC } from "@/lib/api";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAccount } from "@/hooks";
import { Application } from "@/types/application";

interface OverrideKYCButtonProps {
    application: Application;
}

export default function OverrideKYCButton({ application }: OverrideKYCButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const { account } = useAccount();
    const { toast } = useToast();
    const [ approvalSecret, setApprovalSecret ] = useState("");
    const [ overrideReason, setOverrideReason ] = useState("No reason given");

    const { isPending, error: isError, data: hash, reset } = useWriteContract();
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

    const submitOverride = async () => {
        let data = {}

        data = {
          reason: overrideReason,
          reviewerAddress: account?.address || "0x0000000000000000000000000000000000000000"
        }

        overrideKYC(application.id, approvalSecret, data)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <Button
                className="w-[150px]"
                onClick={() => setIsOpen(true)}
            >
                Override KYC
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Override KYC</DialogTitle>
                    <DialogDescription>
                        Override KYC checks for this application on behalf of the Governance Team.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex justify-center items-center p-8">
                    {isPending && <ScaleLoader />}
                    {isConfirming && <p>Confirming transaction...</p>}
                    {isConfirmed && <p>Transaction confirmed!</p>}

                    {!isPending && (
                      <div className="flex justify-center">
                        <Label>
                          {`Overriding KYC for ${application.name} for ${application.datacap} PiBs. Enter your secret to approve.`}
                        </Label>
                      </div>
                    )}
                    
                </div>

                <div className="flex gap-2 flex-col">
                  <div className="flex center-items justify-center">
                    <Input
                          type="text"
                          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                          placeholder="Give a short reason"
                          onChange={(e) => setOverrideReason(e.target.value)}
                        />
                    </div>
                    <div className="flex center-items justify-center">
                      <Input
                          type="password"
                          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                          placeholder="secret"
                          onChange={(e) => setApprovalSecret(e.target.value)}
                        />
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                    <Button className="w-[150px]" disabled={isPending} onClick={submitOverride}>
                        {isPending ? "Approving..." : "APPROVE"}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}