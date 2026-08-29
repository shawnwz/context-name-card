"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIdentityDialog, type EditableIdentity } from "./edit-identity-dialog";
import { DeleteIdentityAlert } from "./delete-identity-alert";

export function IdentityActionsMenu({ identity }: { identity: EditableIdentity }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Identity actions" />}
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditIdentityDialog identity={identity} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteIdentityAlert
        identityId={identity.id}
        displayName={identity.displayName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
