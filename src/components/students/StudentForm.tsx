
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Student } from "@/types";
import { SUBJECTS, CLASSES } from "@/lib/mock-data";
import { toast } from "sonner";

interface StudentFormProps {
  student?: Student;
  onSubmit: (student: Omit<Student, "id">) => void;
  onCancel: () => void;
}

export const StudentForm = ({ student, onSubmit, onCancel }: StudentFormProps) => {
  const [name, setName] = useState(student?.name || "");
  const [classValue, setClassValue] = useState(student?.class || CLASSES[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    student?.subjects || []
  );

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Name is required");
      return;
    }

    if (selectedSubjects.length === 0) {
      toast.error("At least one subject must be selected");
      return;
    }

    onSubmit({
      name,
      class: classValue,
      subjects: selectedSubjects,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="space-y-2">
        <Label htmlFor="name">Student Name</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter student name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="class">Class</Label>
        <div className="flex gap-4">
          {CLASSES.map(c => (
            <label key={c} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="class"
                value={c}
                checked={classValue === c}
                onChange={() => setClassValue(c)}
                className="peer"
              />
              <span className="text-sm font-medium peer-hover:text-primary">Class {c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subjects</Label>
        <div className="grid grid-cols-2 gap-3">
          {SUBJECTS.map(subject => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject}`}
                checked={selectedSubjects.includes(subject)}
                onCheckedChange={() => handleSubjectToggle(subject)}
              />
              <label
                htmlFor={`subject-${subject}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {subject}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {student ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
