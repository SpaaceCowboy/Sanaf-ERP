'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Building,
  Globe,
  Palette,
  Database,
  Shield,
  Save,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

function ProfileSettings() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-xl bg-electric-900 text-electric-300">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" defaultValue={user?.phone || ''} placeholder="+1 234 567 8900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" defaultValue={user?.department || ''} placeholder="e.g. Production" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Badge className="bg-electric-950/50 text-electric-300 border-electric-800/50">
            {user?.role}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Role assigned by administrator
          </span>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage your password and security preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Change Password</h4>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-volt-950/50">
              <Shield className="w-5 h-5 text-volt-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { label: 'Order Updates', description: 'Get notified when order status changes' },
          { label: 'Project Deadlines', description: 'Reminders for upcoming project deadlines' },
          { label: 'Low Stock Alerts', description: 'Alerts when inventory is below threshold' },
          { label: 'Task Assignments', description: 'Notifications for new task assignments' },
          { label: 'System Updates', description: 'Important system and maintenance notifications' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
          >
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-electric-600 transition-colors relative">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-muted-foreground">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-electric-600 transition-colors relative">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-muted-foreground">In-App</span>
              </label>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanySettings() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          {isAdmin ? 'Manage company details used in documents' : 'View company details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              defaultValue="Electronic Industries Ltd."
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-id">Tax ID / VAT Number</Label>
            <Input id="tax-id" defaultValue="US123456789" disabled={!isAdmin} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              defaultValue="123 Industrial Park, Tech City"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" defaultValue="San Francisco" disabled={!isAdmin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" defaultValue="United States" disabled={!isAdmin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone</Label>
            <Input id="company-phone" defaultValue="+1 555 123 4567" disabled={!isAdmin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Email</Label>
            <Input
              id="company-email"
              type="email"
              defaultValue="info@electronicindustries.com"
              disabled={!isAdmin}
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Company Info
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocalizationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Localization</CardTitle>
        <CardDescription>Set your preferred language and regional settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select defaultValue="en">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select defaultValue="utc-8">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                <SelectItem value="utc+0">UTC</SelectItem>
                <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select defaultValue="usd">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="jpy">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select defaultValue="mdy">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'dark', label: 'Dark', bg: 'bg-carbon-950' },
              { value: 'light', label: 'Light', bg: 'bg-white' },
              { value: 'system', label: 'System', bg: 'bg-gradient-to-r from-carbon-950 to-white' },
            ].map((theme) => (
              <div
                key={theme.value}
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all',
                  theme.value === 'dark'
                    ? 'border-electric-500'
                    : 'border-border hover:border-electric-800/50'
                )}
              >
                <div className={cn('h-16 rounded-md mb-2', theme.bg)} />
                <p className="text-sm font-medium text-center">{theme.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Accent Color</Label>
          <div className="flex gap-3">
            {[
              { value: 'green', color: 'bg-electric-500' },
              { value: 'blue', color: 'bg-circuit-500' },
              { value: 'yellow', color: 'bg-volt-500' },
              { value: 'purple', color: 'bg-violet-500' },
              { value: 'red', color: 'bg-danger-500' },
            ].map((accent) => (
              <button
                key={accent.value}
                className={cn(
                  'w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                  accent.color,
                  accent.value === 'green' ? 'ring-electric-500' : 'ring-transparent'
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Appearance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'company':
        return <CompanySettings />;
      case 'localization':
        return <LocalizationSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {settingsSections.map((section, index) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeSection === section.id
                      ? 'bg-electric-950/50 text-electric-400 border border-electric-800/50'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </motion.button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
