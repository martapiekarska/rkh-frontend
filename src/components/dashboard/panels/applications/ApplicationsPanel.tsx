import { Application } from "@/types/application";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CopyIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useToast } from "../../../ui/use-toast";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicationActionButton } from "./ApplicationActionButton";
import { useAccount } from "@/hooks";
import { AccountRole } from "@/types/account";
import { overrideKYC } from "@/lib/api";
import OverrideKYCButton from "@/components/sign/OverrideKYCButton";

interface ApplicationsPanelProps {
  applications: Application[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function ApplicationsPanel({
  applications,
  totalCount,
  currentPage,
  pageSize,
}: ApplicationsPanelProps) {
  const { toast } = useToast();
  const { account } = useAccount()

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <CardDescription>
          Consult and manage Fil+ program applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Github</TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden md:table-cell">DataCap</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => {
              return (
                <TableRow key={application.id}>
                  <TableCell className="hidden md:table-cell font-medium">
                      {application.githubPrNumber ? (
                      <Link
                        href={`${application.githubPrLink}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 transition-colors underline"
                      >
                        {application.githubPrNumber}
                      </Link>
                    ) : (
                      application.id
                    )}
                  </TableCell>
                  <TableCell>{application.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link 
                      href={`https://github.com/${application.github}`} 
                      target="_blank"
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span className="underline">{application.github}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {application.country}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {application.datacap} PiB
                  </TableCell>
                  <TableCell className="flex items-center">
                    <ApplicationStatusBadge application={application} />
                  </TableCell>
                  <TableCell>
                    <ApplicationActionButton application={application} />
                  </TableCell>
                  <TableCell className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {application.githubPrLink && (
                          <DropdownMenuItem>
                            <Link
                              href={`${application.githubPrLink}`}
                              target="_blank"
                            >
                              View PR
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {application.status === 'KYC_PHASE' && (
                          <DropdownMenuItem>
                            <Link
                            href={`https://verify.zyphe.com/flow/fil-kyc/kyc/kyc?applicationId=${application.id}`}
                            target="_blank"
                          >
                            Submit KYC
                          </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <CopyIcon
                      className="h-4 w-4 ml-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(application.id);
                          toast({
                            title: "Application ID copied",
                            description:
                              "The application ID has been copied to the clipboard.",
                          });
                        } catch (err) {
                          console.error("Failed to copy text: ", err);
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <strong>
            {startIndex}-{endIndex}
          </strong>{" "}
          of <strong>{totalCount}</strong> applications
        </div>
      </CardFooter>
    </Card>
  );
}
