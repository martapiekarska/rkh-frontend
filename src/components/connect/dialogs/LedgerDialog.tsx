import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { LedgerConnector } from "@/lib/connectors/ledger-connector";
import { useAccount } from "@/hooks";

interface LedgerDialogProps {
  onClose: () => void;
}

interface LedgerAccount {
  address: string;
  pubKey: Buffer;
  path: string;
  index: number;
}

export default function LedgerDialog({ onClose }: LedgerDialogProps) {
  const { connect, connectors } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();
  const isConnectedRef = useRef(false); // Track whether connection has been attempted

  const accountsPerPage = 5;

  useEffect(() => {
    if (!isConnectedRef.current) {
      handleLedgerConnect();
      isConnectedRef.current = true; // Mark as connected
    }
  }, []);

  const handleLedgerConnect = async () => {
    setIsConnecting(true);

    try {
      const ledgerConnector = connectors["ledger"] as LedgerConnector;
      const accounts = await ledgerConnector.fetchAccounts();
      console.log("accounts", accounts);
      setLedgerAccounts(accounts);
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
      onClose(); // Close the dialog on error
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLedgerAccountSelect = async (selectedAccount: LedgerAccount) => {
    try {
      await connect("ledger", selectedAccount.index);
      onClose();
    } catch (error) {
      console.error("Ledger connection error:", error);
      toast({
        title: "Connection Failed",
        description: "There was an error connecting your Ledger account. Please try again.",
        variant: "destructive",
      });
      onClose(); // Close the dialog on error
    }
  };

  const paginatedAccounts = ledgerAccounts.slice(
    currentPage * accountsPerPage,
    (currentPage + 1) * accountsPerPage
  );

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Connecting to Ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold">Select Ledger Account</h3>
      {paginatedAccounts.map((account, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 border rounded"
        >
          <div>
            <p className="font-mono text-sm">{account.address}</p>
            <p className="text-xs text-gray-500">Index: {account.index}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(account.address)
                toast({
                  title: "Copied to clipboard",
                  description: "The address has been copied to your clipboard.",
                });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => handleLedgerAccountSelect(account)}>
              Select
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(
                Math.ceil(ledgerAccounts.length / accountsPerPage) - 1,
                prev + 1
              )
            )
          }
          disabled={(currentPage + 1) * accountsPerPage >= ledgerAccounts.length}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
