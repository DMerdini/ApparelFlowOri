'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  pin: z.string().length(6, { message: 'PIN must be 6 digits.' }).optional(),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const auth = useAuth();
  const db = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const { formState, trigger, watch } = form;
  const enteredPin = watch('pin');

  useEffect(() => {
    const subscription = watch(async (value, { name, type }) => {
      if (name === 'displayName' || name === 'email' || name === 'password') {
        const isFormValid = await trigger(['displayName', 'email', 'password']);
        if (isFormValid && !showPin) {
          const newPin = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedPin(newPin);
          setShowPin(true);
        } else if (!isFormValid && showPin) {
          setShowPin(false);
          setGeneratedPin('');
          form.resetField('pin');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger, showPin, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.displayName });

      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        displayName: values.displayName,
        email: values.email,
        role: 'pending',
        status: 'active',
        createdAt: serverTimestamp(),
        id: user.uid,
      };

      await setDoc(userDocRef, userData);
      
      toast({
        title: "Registration Successful",
        description: "Your account is created and waiting for admin approval.",
      });

      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unknown error occurred. Please try again.',
      });
      setShowPin(false);
      setGeneratedPin('');
      form.reset();
    } finally {
      setIsLoading(false);
    }
  }

  const isPinValid = enteredPin === generatedPin;
  const canSubmit = formState.isValid && showPin && isPinValid;

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex items-center justify-center">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="ml-2 text-2xl font-bold">ApparelFlow</h1>
        </div>
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showPin && (
               <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">Enter the code below to continue</p>
                  <div className="my-4 text-center">
                        <p className="text-2xl font-bold tracking-widest text-primary bg-primary/10 rounded-md p-2">
                           {generatedPin}
                        </p>
                   </div>
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmation Code</FormLabel>
                        <FormControl>
                          <Input placeholder="6-digit code" {...field} maxLength={6} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline text-primary">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
