import { View } from "react-native";
import { Select } from "@/components/ui/Select";
import type { SelectOption } from "./types";

type Props = {
  supplierId: string | null;
  branchId: string | null;
  defaultLocationId: string | null;
  suppliers: SelectOption[];
  branches: SelectOption[];
  locations: SelectOption[];
  onSupplier: (id: string) => void;
  onBranch: (id: string) => void;
  onDefaultLocation: (id: string) => void;
};

export function SessionHeader({
  supplierId,
  branchId,
  defaultLocationId,
  suppliers,
  branches,
  locations,
  onSupplier,
  onBranch,
  onDefaultLocation,
}: Props) {
  return (
    <View className="px-5 pt-4 pb-5 gap-4 border-b border-border">
      <Select
        label="Supplier"
        placeholder="Select a supplier"
        value={supplierId}
        options={suppliers}
        onChange={onSupplier}
      />
      <Select
        label="Destination branch"
        placeholder="Select a branch"
        value={branchId}
        options={branches}
        onChange={onBranch}
      />
      <Select
        label="Default location"
        placeholder={branchId ? "Select a location" : "Select a branch first"}
        value={defaultLocationId}
        options={locations}
        onChange={onDefaultLocation}
        disabled={!branchId}
      />
    </View>
  );
}
