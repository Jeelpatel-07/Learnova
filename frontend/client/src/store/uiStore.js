import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  modalData: null,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  openModal: (modalName, data = null) => set({ modalOpen: modalName, modalData: data }),
  closeModal: () => set({ modalOpen: null, modalData: null }),
}));

export default useUiStore;
