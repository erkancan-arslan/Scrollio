import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminSignInScreen } from '../features/admin/screens/AdminSignInScreen';
import { AdminDashboardScreen } from '../features/admin/screens/AdminDashboardScreen';
import { ReferenceVideoLibraryScreen } from '../features/admin/screens/ReferenceVideoLibraryScreen';
import { UploadReferenceVideoScreen } from '../features/admin/screens/UploadReferenceVideoScreen';
import { ReferenceVideoDetailScreen } from '../features/admin/screens/ReferenceVideoDetailScreen';
import { CreateGenerationJobScreen } from '../features/admin/screens/CreateGenerationJobScreen';
import { GenerationJobsListScreen } from '../features/admin/screens/GenerationJobsListScreen';
import { GenerationJobDetailScreen } from '../features/admin/screens/GenerationJobDetailScreen';
import { GeneratedVideosScreen } from '../features/admin/screens/GeneratedVideosScreen';

export type AdminStackParamList = {
  AdminSignIn: undefined;
  AdminDashboard: undefined;
  AdminReferenceVideoLibrary: undefined;
  AdminUploadReferenceVideo: undefined;
  AdminReferenceVideoDetail: { videoId: string };
  AdminCreateJob: { referenceVideoId?: string } | undefined;
  AdminJobsList: undefined;
  AdminJobDetail: { jobId: string };
  AdminGeneratedVideos: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminSignIn"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AdminSignIn" component={AdminSignInScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminReferenceVideoLibrary" component={ReferenceVideoLibraryScreen} />
      <Stack.Screen name="AdminUploadReferenceVideo" component={UploadReferenceVideoScreen} />
      <Stack.Screen name="AdminReferenceVideoDetail" component={ReferenceVideoDetailScreen} />
      <Stack.Screen name="AdminCreateJob" component={CreateGenerationJobScreen} />
      <Stack.Screen name="AdminJobsList" component={GenerationJobsListScreen} />
      <Stack.Screen name="AdminJobDetail" component={GenerationJobDetailScreen} />
      <Stack.Screen name="AdminGeneratedVideos" component={GeneratedVideosScreen} />
    </Stack.Navigator>
  );
};
