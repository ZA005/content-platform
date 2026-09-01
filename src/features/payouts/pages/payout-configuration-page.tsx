import { useState } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayoutConfiguration } from "@/features/payouts/hooks/use-payout-configuration";
import { useCompensation } from "@/features/payouts/hooks/use-compensation";
import { useWorkSchedule } from "@/features/payouts/hooks/use-work-schedule";
import { WorkScheduleEditor } from "@/features/payouts/components/work-schedule-editor";
import { formatCurrency } from "@/lib/currency";
import { Plus, Trash2 } from "lucide-react";

export function PayoutConfigurationPage() {
  const { config, isLoading, isSaving, updatePayoutDay, updateDefaultMultiplier } =
    usePayoutConfiguration();
  const { compensations, creators, managers, isLoading: isLoadingComp, isSaving: isSavingComp, updateCompensation, deleteCompensation } = useCompensation();
  const { schedules, isSaving: isSavingSchedules, updateWorkSchedule, deleteWorkSchedule } = useWorkSchedule();
  const [payoutDay, setPayoutDay] = useState<string>("");
  const [multiplier, setMultiplier] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [dayOffMult, setDayOffMult] = useState<string>("");
  const [scheduleUserId, setScheduleUserId] = useState<string>("");
  const [scheduleWorkingDays, setScheduleWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

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

          {/* Work Schedules */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Work Schedules</CardTitle>
                <CardDescription>Configure working days for creators</CardDescription>
              </div>
              <Button onClick={() => setShowScheduleModal(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-sm text-neutral-400">No custom schedules configured. Users will use default Mon-Fri schedule.</p>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => {
                    const creator = creators.find((c) => c.id === schedule.userId);
                    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const workingDaysStr = schedule.workingDays
                      .map((d) => dayLabels[d])
                      .join(", ");
                    return (
                      <div key={schedule.id} className="p-3 border border-neutral-800 rounded flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{creator?.name || "Unknown"}</p>
                          <p className="text-xs text-neutral-400">Working days: {workingDaysStr}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setScheduleToDelete(schedule.id);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={isSavingSchedules}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compensation Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compensation Profiles</CardTitle>
                <CardDescription>Users with configured compensation</CardDescription>
              </div>
              <Button onClick={() => setShowModal(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Compensation
              </Button>
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
                        <th className="text-left py-2 px-2 font-medium"></th>
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
                          <td className="py-2 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCompensation(comp.id)}
                              disabled={isSavingComp}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* Add Compensation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Compensation Profile</DialogTitle>
            <DialogDescription>Configure salary and multiplier for a creator or manager</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Select */}
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Choose a creator or manager" />
                </SelectTrigger>
                <SelectContent>
                  {creators.length > 0 && (
                    <>
                      {creators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name} (Creator)
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {managers.length > 0 && (
                    <>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} (Manager)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Base Salary */}
            <div>
              <Label htmlFor="base-salary">Base Salary ($)</Label>
              <Input
                id="base-salary"
                type="number"
                step="10"
                min="0"
                placeholder="3000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Daily: ${baseSalary ? (parseInt(baseSalary) / 30).toFixed(2) : "0.00"}
              </p>
            </div>

            {/* Day-Off Multiplier (Optional) */}
            <div>
              <Label htmlFor="day-off-mult">Day-Off Multiplier (Optional)</Label>
              <Input
                id="day-off-mult"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Leave blank for default (1.5)"
                value={dayOffMult}
                onChange={(e) => setDayOffMult(e.target.value)}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {dayOffMult ? `${dayOffMult}x multiplier` : "Uses default 1.5x"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setSelectedUserId("");
                  setBaseSalary("");
                  setDayOffMult("");
                }}
                disabled={isSavingComp}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedUserId && baseSalary) {
                    await updateCompensation(
                      selectedUserId,
                      parseInt(baseSalary),
                      dayOffMult ? parseFloat(dayOffMult) : undefined
                    );
                    setShowModal(false);
                    setSelectedUserId("");
                    setBaseSalary("");
                    setDayOffMult("");
                  }
                }}
                disabled={isSavingComp || !selectedUserId || !baseSalary}
              >
                {isSavingComp ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Work Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Work Schedule</DialogTitle>
            <DialogDescription>Configure working days for a creator</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Select */}
            <div>
              <Label htmlFor="schedule-user">Select Creator</Label>
              <Select value={scheduleUserId} onValueChange={setScheduleUserId}>
                <SelectTrigger id="schedule-user">
                  <SelectValue placeholder="Choose a creator" />
                </SelectTrigger>
                <SelectContent>
                  {creators
                    .filter((creator) => !schedules.some((s) => s.userId === creator.id))
                    .map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Schedule Editor */}
            {scheduleUserId && (
              <WorkScheduleEditor
                schedule={{
                  id: "",
                  userId: scheduleUserId,
                  workingDays: scheduleWorkingDays,
                  customDaysOff: [],
                  updatedAt: new Date().toISOString(),
                }}
                onUpdate={async (days) => {
                  setScheduleWorkingDays(days);
                }}
                isLoading={isSavingSchedules}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleUserId("");
                  setScheduleWorkingDays([1, 2, 3, 4, 5]);
                }}
                disabled={isSavingSchedules}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (scheduleUserId) {
                    await updateWorkSchedule(scheduleUserId, scheduleWorkingDays);
                    setShowScheduleModal(false);
                    setScheduleUserId("");
                    setScheduleWorkingDays([1, 2, 3, 4, 5]);
                  }
                }}
                disabled={isSavingSchedules || !scheduleUserId}
              >
                {isSavingSchedules ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Work Schedule Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Work Schedule"
        description="Are you sure you want to delete this work schedule? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (scheduleToDelete) {
            await deleteWorkSchedule(scheduleToDelete);
            setScheduleToDelete(null);
          }
        }}
      />
    </div>
  );
}
