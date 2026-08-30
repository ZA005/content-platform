import { useState } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePayoutConfiguration } from "@/features/payouts/hooks/use-payout-configuration";
import { useCompensation } from "@/features/payouts/hooks/use-compensation";
import { formatCurrency } from "@/lib/currency";

export function PayoutConfigurationPage() {
  const { config, isLoading, isSaving, updatePayoutDay, updateDefaultMultiplier } =
    usePayoutConfiguration();
  const { compensations, isLoading: isLoadingComp } = useCompensation();
  const [payoutDay, setPayoutDay] = useState<string>("");
  const [multiplier, setMultiplier] = useState<string>("");

  if (isLoading || isLoadingComp) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payout Configuration</h1>
        <p className="text-sm text-neutral-400">
          Configure payout settings, salaries, and work schedules
        </p>
      </div>

      {config && (
        <div className="space-y-6">
          {/* Payout Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Schedule</CardTitle>
              <CardDescription>Configure when payouts occur each month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payout-day">Payout Day of Month (1-31)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="payout-day"
                    type="number"
                    min="1"
                    max="31"
                    value={payoutDay || config.payoutDayOfMonth}
                    onChange={(e) => setPayoutDay(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => {
                      const day = parseInt(payoutDay || String(config.payoutDayOfMonth));
                      updatePayoutDay(day);
                      setPayoutDay("");
                    }}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Current: {config.payoutDayOfMonth}th of each month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Default Day-Off Multiplier */}
          <Card>
            <CardHeader>
              <CardTitle>Default Day-Off Multiplier</CardTitle>
              <CardDescription>Default payout multiplier for work completed on days off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="multiplier">Multiplier (e.g., 1.5 for 1.5x)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={multiplier || config.defaultDayOffMultiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => {
                      const m = parseFloat(multiplier || String(config.defaultDayOffMultiplier));
                      updateDefaultMultiplier(m);
                      setMultiplier("");
                    }}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Current: {config.defaultDayOffMultiplier}x multiplier
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compensation Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Compensation Profiles</CardTitle>
              <CardDescription>Users with configured compensation</CardDescription>
            </CardHeader>
            <CardContent>
              {compensations.length === 0 ? (
                <p className="text-sm text-neutral-400">No compensation profiles configured yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-800">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium">Name</th>
                        <th className="text-left py-2 px-2 font-medium">Role</th>
                        <th className="text-left py-2 px-2 font-medium">Base Salary</th>
                        <th className="text-left py-2 px-2 font-medium">Day-Off Multiplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compensations.map((comp) => (
                        <tr key={comp.id} className="border-b border-neutral-900">
                          <td className="py-2 px-2">{comp.userName}</td>
                          <td className="py-2 px-2 capitalize text-neutral-400">{comp.role}</td>
                          <td className="py-2 px-2">{formatCurrency(comp.baseSalaryCentavos)}</td>
                          <td className="py-2 px-2 text-neutral-400">
                            {comp.dayOffMultiplier || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
