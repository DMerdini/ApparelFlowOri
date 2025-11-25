'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { MoreHorizontal, Check, Shield, User as UserIcon, X, AlertTriangle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole, UserStatus } from '@/types';
import { useFirestore } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const user = row.original as User;
  const { toast } = useToast();
  const db = useFirestore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const openConfirmation = (role: UserRole) => {
    setSelectedRole(role);
    setSelectedStatus(null);
    setVerificationCode(generateCode());
    setIsConfirmOpen(true);
    setError('');
    setConfirmationCode('');
  };

  const openStatusConfirmation = (status: UserStatus) => {
    setSelectedStatus(status);
    setSelectedRole(null);
    setVerificationCode(generateCode());
    setIsConfirmOpen(true);
    setError('');
    setConfirmationCode('');
  }

  const handleConfirm = async () => {
    if (confirmationCode !== verificationCode) {
      setError('Invalid code. Please try again.');
      return;
    }
    setError('');
    try {
      const userRef = doc(db, 'users', user.uid);
      if (selectedRole) {
          await updateDoc(userRef, { role: selectedRole });
          toast({ title: 'Success', description: `User role updated to ${selectedRole}.` });
      } else if (selectedStatus) {
        await updateDoc(userRef, { status: selectedStatus });
        toast({ title: 'Success', description: `User status updated to ${selectedStatus}.` });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update user.' });
    }
    setIsConfirmOpen(false);
  };
  
  const handleApproveUser = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'verified' });
      toast({ title: 'Success', description: `User has been approved.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not approve user.' });
    }
  }


  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {user.role === 'pending' && (
          <DropdownMenuItem onClick={handleApproveUser}>
            <Check className="mr-2 h-4 w-4" /> Approve User
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => openConfirmation('SysAdmin')} disabled={user.role === 'SysAdmin'}>
                        <Shield className="mr-2 h-4 w-4" /> SysAdmin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openConfirmation('admin')} disabled={user.role === 'admin'}>
                        <Shield className="mr-2 h-4 w-4" /> Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openConfirmation('verified')} disabled={user.role === 'verified'}>
                        <UserIcon className="mr-2 h-4 w-4" /> Verified
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => openConfirmation('pending')} disabled={user.role === 'pending'}>
                        <X className="mr-2 h-4 w-4" /> Pending
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
         <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => openStatusConfirmation('Active')} disabled={user.status === 'Active'}>
                        <Check className="mr-2 h-4 w-4" /> Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openStatusConfirmation('inactive')} disabled={user.status === 'inactive'}>
                        <X className="mr-2 h-4 w-4" /> Inactive
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => openStatusConfirmation('suspended')} disabled={user.status === 'suspended'}>
                        <AlertTriangle className="mr-2 h-4 w-4" /> Suspended
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Admin Verification</DialogTitle>
                <DialogDescription>
                   Enter the following code to confirm the change:
                   <div className="my-4 text-center">
                        <p className="text-2xl font-bold tracking-widest text-primary bg-primary/10 rounded-md p-2">
                           {verificationCode}
                        </p>
                   </div>
                </DialogDescription>
            </DialogHeader>
            <Input 
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
            />
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirm}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
