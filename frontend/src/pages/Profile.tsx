import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Profile() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        description="Manage your learning account information."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <Avatar fallback="MB" size="lg" className="h-24 w-24 mb-4 text-xl" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Mohan Balu</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Engineering Student</p>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input id="prof-name" label="Full Name" defaultValue="Mohan Balu" />
              <Input id="prof-email" label="Email Address" defaultValue="you@example.com" disabled />
            </div>
            <Input id="prof-college" label="College Name" defaultValue="IndiWeb Engineering Academy" />
            <div className="flex justify-end pt-4">
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
