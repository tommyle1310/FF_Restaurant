type Expected_Student = {
  name: string;
  age: number;
};

type Student_backend = {
  student_age: string;
  dog_name: string;
  student_name: string;
};

let students: Expected_Student[] = [];

const studentBackend: any = [
  {
    student_age: "20",
    dog_name: "Rex",
    student_name: "STUDENT_sad",
  },
  {
    student_age: "21",
    dog_name: "Max",
    student_name: "STUDENT_dad",
  },
];

const buildBackendToExpectedStudentType = (data: any): any => {
  return data.map((item: Student_backend) => {
    return {
      age: +item.student_age,
      name: item.student_name,
    };
  });
};
students = buildBackendToExpectedStudentType(
  studentBackend
) as Expected_Student[];
console.log(students);
