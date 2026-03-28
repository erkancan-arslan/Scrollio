import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeacherSignInScreen } from '../features/teacher/screens/TeacherSignInScreen';
import { TeacherSignUpScreen } from '../features/teacher/screens/TeacherSignUpScreen';
import { TeacherDashboardScreen } from '../features/teacher/screens/TeacherDashboardScreen';
import { TeacherReferenceVideoScreen } from '../features/teacher/screens/TeacherReferenceVideoScreen';
import { TeacherCreateLessonScreen } from '../features/teacher/screens/TeacherCreateLessonScreen';
import { TeacherLessonListScreen } from '../features/teacher/screens/TeacherLessonListScreen';
import { TeacherLessonDetailScreen } from '../features/teacher/screens/TeacherLessonDetailScreen';
import { TeacherClassroomScreen } from '../features/teacher/screens/TeacherClassroomScreen';

export type TeacherStackParamList = {
  TeacherSignIn: undefined;
  TeacherSignUp: undefined;
  TeacherDashboard: undefined;
  TeacherReferenceVideo: undefined;
  TeacherCreateLesson: { classroomId?: string } | undefined;
  TeacherLessonList: undefined;
  TeacherLessonDetail: { lessonId: string };
  TeacherClassroom: undefined;
};

const Stack = createNativeStackNavigator<TeacherStackParamList>();

export const TeacherNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TeacherSignIn"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="TeacherSignIn" component={TeacherSignInScreen} />
      <Stack.Screen name="TeacherSignUp" component={TeacherSignUpScreen} />
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <Stack.Screen name="TeacherReferenceVideo" component={TeacherReferenceVideoScreen} />
      <Stack.Screen name="TeacherCreateLesson" component={TeacherCreateLessonScreen} />
      <Stack.Screen name="TeacherLessonList" component={TeacherLessonListScreen} />
      <Stack.Screen name="TeacherLessonDetail" component={TeacherLessonDetailScreen} />
      <Stack.Screen name="TeacherClassroom" component={TeacherClassroomScreen} />
    </Stack.Navigator>
  );
};
