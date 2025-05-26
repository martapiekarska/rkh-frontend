"use client";

import { useEffect, useState } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { ExternalLink } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount as useAccountWagmi, useSwitchChain } from "wagmi";
import { useFilecoinPublicClient } from "@/hooks/use-filecoin-public-client";
import Safe, { Eip1193Provider } from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  OperationType
} from '@safe-global/types-kit'

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAccount } from "@/hooks";
import { Application } from "@/types/application";
import { isFilecoinAddress } from "@/types/filecoin";
import { env } from "@/config/environment";
import { encodeFunctionData } from "viem/utils";


const contractAbi = [{
    "type": "function",
    "name": "addAllowance",
    "inputs": [
    {
        "name": "allocator",
        "type": "address",
        "internalType": "address"
    },
    {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
    }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
}]

interface SignMetaAllocatorTransactionButtonProps {
    application: Application;
}

export default function SignMetaAllocatorTransactionButton({ application }: SignMetaAllocatorTransactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const { account } = useAccount();
    const { toast } = useToast();
    const { connector } = useAccountWagmi();
    const client = useFilecoinPublicClient();
    const { chains, switchChain } = useSwitchChain()

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

    const addVerifier = async (verifierAddress: string, datacap: number) => {
        // 1PiB is 2^50
        const fullDataCap = BigInt(datacap * 1_125_899_906_842_624);
        writeContract({
            address: env.metaAllocatorContractAddress as `0x${string}`,
            abi: contractAbi,
            functionName: "addAllowance",
            args: [
                verifierAddress as `0x${string}`,
                fullDataCap
            ],
        });
    };

    const submitTransaction = async () => {
        await addVerifier(application.address, application.datacap);
    }

    const submitSafeTransaction = async () => {
        switchChain({
            chainId: chains[0].id
        })
        const safeAddress = "0x2e25A2f6bC2C0b7669DFB25180Ed57e07dAabe9e"

        const provider = await connector?.getProvider();

        const safeKit = await Safe.init({
            provider: provider as Eip1193Provider,
            safeAddress: safeAddress
        })

        let txAddress = application.address;

        if (isFilecoinAddress(txAddress)) {
            try {
                const converted = await client?.request({
                    method: "Filecoin.FilecoinAddressToEthAddress",
                    params: [txAddress],
                })
                txAddress = converted as `0x${string}`;

            } catch (error) {
                toast({
                    title: "Submission Failed",
                    description:
                      error instanceof Error
                        ? error.message
                        : "An unknown error occurred whilst converting to Ethereum address.",
                    variant: "destructive",
                  });
            }
        }

        // Now should be a proper Ethereum address one way or another
        if ( txAddress.length != 42 || !(txAddress.startsWith('0x')) ) {
            toast({
                title: "Submission Failed",
                description: "Could not convert to Ethereum address.",
                variant: "destructive",
              });
        }

        // 1PiB is 2^50
        const fullDataCap = BigInt(application.datacap * 1_125_899_906_842_624);
        const data = encodeFunctionData({
            abi: contractAbi,
            functionName: 'addAllowance',
            args: [
                txAddress as `0x${string}`,
                fullDataCap
            ],
          })

        const safeTransactionData: MetaTransactionData = {
            to: env.metaAllocatorContractAddress as `0x${string}`,
            value: '0',
            data: data,
            operation: OperationType.Call
        }

        const safeTransaction = await safeKit.createTransaction({
            transactions: [safeTransactionData]
        })

        const signedSafeTransaction = await safeKit.signTransaction(safeTransaction)

        const executeTxResponse = await safeKit.executeTransaction(signedSafeTransaction)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <Button
                className="w-[150px]"
                disabled={!account?.isConnected || isPending}
                onClick={() => setIsOpen(true)}
            >
                Approve
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sign Transaction</DialogTitle>
                    <DialogDescription>
                        Signing a transaction to set meta allocator allowance.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex justify-center items-center p-8">
                    {isPending && <ScaleLoader />}
                    {isConfirming && <p>Confirming transaction...</p>}
                    {isConfirmed && <p>Transaction confirmed!</p>}

                    {!isPending && (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow key="to">
                                <TableCell>{"To"}</TableCell>
                                <TableCell>
                                    {env.metaAllocatorContractAddress.slice(0, 6)}...{env.metaAllocatorContractAddress.slice(-4)}
                                    <a
                                    href={`https://filscan.io/en/address/${env.metaAllocatorContractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-block align-middle"
                                    >
                                    <ExternalLink size={16} />
                                    </a>
                                </TableCell>
                            </TableRow>
                            <TableRow key="verifier">
                                <TableCell>{"Verifier"}</TableCell>
                                <TableCell>
                                    {application.address.slice(0, 6)}...{application.address.slice(-4)}
                                    <a
                                    href={`https://filscan.io/en/address/${application.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-block align-middle"
                                    >
                                    <ExternalLink size={16} />
                                    </a>
                                </TableCell>
                            </TableRow>
                                <TableRow key="datacap">
                                <TableCell>{"DataCap"}</TableCell>
                                <TableCell>{application.datacap} PiB</TableCell>
                            </TableRow>
                        </TableBody>
                        </Table>
                    )}
                </div>

                <div className="flex justify-center">
                    <Button className="w-[150px]" disabled={isPending} onClick={submitSafeTransaction}>
                        {isPending ? "Submitting..." : "Submit"}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}