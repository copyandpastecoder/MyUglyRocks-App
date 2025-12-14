// Query keys and cache configuration
export { queryKeys, cacheConfig } from '@/lib/query-keys';

// Shared utility hooks
export {
  useCrudMutation,
  useCrudMutationWithId,
  useDeleteMutation,
} from './use-crud-mutation';

export {
  useModalState,
  useModalStates,
  useConfirmDialog,
} from './use-modal-state';

export {
  usePagination,
  useSearchFilterPagination,
} from './use-pagination';

// Material list management
export { useMaterialList } from './use-material-list';

// Specimens hooks
export { useSpecimens, useSpecimen, useBarrelNicknames } from './use-specimens';

// Materials hooks
export { useMaterials, useMaterial } from './use-materials';

// Posts/Gallery hooks
export {
  usePosts,
  usePost,
  useUserPosts,
  useVoteCount,
  useComments,
  useVoteMutation,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useReportComment,
} from './use-posts';

// Tumblers hooks
export {
  useTumblers,
  useTumblersWithBarrels,
  useTumbler,
  useTumblerModels,
  useCreateTumbler,
  useUpdateTumbler,
  useDeleteTumbler,
  useAddBarrel,
  useUpdateBarrel,
  useDeleteBarrel,
} from './use-tumblers';

// Cycles hooks
export {
  useCycles,
  useCycle,
  useStageRun,
  useCreateCycle,
  useUpdateCycle,
  useDeleteCycle,
  useCompleteCycle,
  useAddStageRun,
  useCompleteStageRun,
  useDeleteStageRun,
} from './use-cycles';

// User hooks
export {
  useProfile,
  useSettings,
  useStats,
  useUpdateProfile,
  useUploadAvatar,
  useUpdateSettings,
  useChangePassword,
  useDeactivateAccount,
} from './use-user';

// Admin hooks
export {
  useAdminStats,
  useReports,
  useReport,
  useResolveReport,
  useAdminDeleteComment,
  useAdminUsers,
  useAdminUser,
  useChangeUserRole,
  useBanUser,
  useUnbanUser,
  useAdminSpecimens,
  useCreateSpecimen,
  useUpdateSpecimen,
  useDeleteSpecimen,
  useAdminMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from './use-admin';

// Inventory hooks
export {
  useInventory,
  useInventoryItem,
  useInventoryStats,
  useCreateInventory,
  useUpdateInventory,
  useDeleteInventory,
  useUpdateInventoryStatus,
  useUpdateInventorySpecimens,
} from './use-inventory';

// User Specimen hooks
export {
  useUserSpecimens,
  useUserSpecimen,
  useSpecimenSearch,
  useCreateUserSpecimen,
  useUpdateUserSpecimen,
  useDeleteUserSpecimen,
} from './use-user-specimens';
