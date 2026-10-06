import { MapPin, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Locations() {
  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage organization work locations and offices."
        actions={
          <Button>
            <Plus size={16} />
            Add Location
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={MapPin}
          title="No locations"
          description="Configured work locations will appear here."
        />
      </Card>
    </div>
  );
}