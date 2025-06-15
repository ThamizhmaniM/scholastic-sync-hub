
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyTestMark, Student } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface WeeklyMarksFormProps {
  students: Student[];
  onSubmit: (mark: Omit<WeeklyTestMark, "id">) => Promise<void>;
  initialData?: WeeklyTestMark;
  onCancel?: () => void;
}

// Helper function to get current week number
const getCurrentWeekNumber = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const WeeklyMarksForm = ({ students, onSubmit, initialData, onCancel }: WeeklyMarksFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    studentId: initialData?.studentId || "",
    subject: initialData?.subject || "",
    weekNumber: initialData?.weekNumber || getCurrentWeekNumber(),
    year: initialData?.year || new Date().getFullYear(),
    marksObtained: initialData?.marksObtained?.toString() ?? "",
    totalMarks: initialData?.totalMarks?.toString() ?? "100",
    testDate: initialData?.testDate || new Date().toISOString().split('T')[0],
    remarks: initialData?.remarks || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.subject) {
      toast({
        title: "Error",
        description: "Please select both student and subject",
        variant: "destructive",
      });
      return;
    }

    const marksObtained = parseFloat(formData.marksObtained);
    const totalMarks = parseFloat(formData.totalMarks);

    if (isNaN(marksObtained) || isNaN(totalMarks) || totalMarks <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid marks. Total marks must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (marksObtained > totalMarks) {
      toast({
        title: "Error",
        description: "Marks obtained cannot be greater than total marks",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        studentId: formData.studentId,
        subject: formData.subject,
        weekNumber: formData.weekNumber,
        year: formData.year,
        marksObtained,
        totalMarks,
        testDate: formData.testDate,
        remarks: formData.remarks,
      });
      toast({
        title: "Success",
        description: initialData ? "Test mark updated successfully" : "Test mark added successfully",
      });
      
      if (!initialData) {
        // Reset form for new entry
        setFormData({
          studentId: formData.studentId, // Keep student selected
          subject: "", // Clear subject
          weekNumber: getCurrentWeekNumber(),
          year: new Date().getFullYear(),
          marksObtained: "",
          totalMarks: "100",
          testDate: new Date().toISOString().split('T')[0],
          remarks: "",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test mark",
        variant: "destructive",
      });
    }
  };

  const selectedStudent = students.find(s => s.id === formData.studentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit" : "Add"} Weekly Test Marks</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student">Student</Label>
              <Select value={formData.studentId} onValueChange={(value) => setFormData({...formData, studentId: value, subject: ''})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} (Class {student.class})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => setFormData({...formData, subject: value})}
                disabled={!selectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {selectedStudent?.subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weekNumber">Week Number</Label>
              <Input
                id="weekNumber"
                type="number"
                min="1"
                max="52"
                value={formData.weekNumber}
                onChange={(e) => setFormData({...formData, weekNumber: parseInt(e.target.value) || 1})}
              />
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
              />
            </div>

            <div>
              <Label htmlFor="marksObtained">Marks Obtained</Label>
              <Input
                id="marksObtained"
                type="text"
                placeholder="e.g. 85"
                value={formData.marksObtained}
                onChange={(e) => setFormData({...formData, marksObtained: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="text"
                placeholder="e.g. 100"
                value={formData.totalMarks}
                onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="testDate">Test Date</Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({...formData, testDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="percentage">Percentage</Label>
              <Input
                id="percentage"
                type="text"
                value={(() => {
                  const obtained = parseFloat(formData.marksObtained);
                  const total = parseFloat(formData.totalMarks);
                  if (!isNaN(obtained) && !isNaN(total) && total > 0) {
                    return `${((obtained / total) * 100).toFixed(2)}%`;
                  }
                  return "N/A";
                })()}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              placeholder="Add any additional remarks about the test..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {initialData ? "Update" : "Add"} Marks
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WeeklyMarksForm;
