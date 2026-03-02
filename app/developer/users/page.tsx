
import { getUsers, getUserStats } from "@/app/actions/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsersChart } from "./users-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { users, totalPages, currentPage } = await getUsers(page);
  const stats = await getUserStats();

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">New Users Trend</h3>
        </div>
        <div className="p-6 pt-0">
          <UsersChart data={stats} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={`/developer/users?page=${currentPage - 1}`}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </span>
          )}
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={`/developer/users?page=${currentPage + 1}`}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
