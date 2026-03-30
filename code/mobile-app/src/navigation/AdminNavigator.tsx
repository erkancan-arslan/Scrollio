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
import { CreateBatchJobScreen } from '../features/admin/screens/CreateBatchJobScreen';
import { BatchJobDetailScreen } from '../features/admin/screens/BatchJobDetailScreen';
import { ReviewTopicsScreen } from '../features/admin/screens/ReviewTopicsScreen';
import { ReviewScriptsScreen } from '../features/admin/screens/ReviewScriptsScreen';
import { KidsModuleVideoCreationScreen } from '../features/admin/screens/KidsModuleVideoCreationScreen';

export type AdminStackParamList = {
  AdminSignIn: undefined;
  AdminDashboard: undefined;
  AdminReferenceVideoLibrary: undefined;
  AdminUploadReferenceVideo: undefined;
  AdminReferenceVideoDetail: { videoId: string };
  AdminCreateJob: { referenceVideoId?: string } | undefined;
  AdminJobsList: undefined;
  AdminJobDetail: { jobId: string; kidsApi?: boolean };
  AdminGeneratedVideos: undefined;
  AdminCreateBatch: { referenceVideoId?: string } | undefined;
  AdminBatchDetail: { batchId: string; kidsApi?: boolean };
  AdminReviewTopics: { batchId: string; jobs: any[] };
  AdminReviewScripts: { batchId: string };
  AdminKidsModuleVideoCreation: undefined;
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
      <Stack.Screen name="AdminCreateBatch" component={CreateBatchJobScreen} />
      <Stack.Screen name="AdminBatchDetail" component={BatchJobDetailScreen} />
      <Stack.Screen name="AdminReviewTopics" component={ReviewTopicsScreen} />
      <Stack.Screen name="AdminReviewScripts" component={ReviewScriptsScreen} />
      <Stack.Screen name="AdminKidsModuleVideoCreation" component={KidsModuleVideoCreationScreen} />
    </Stack.Navigator>
  );
};
