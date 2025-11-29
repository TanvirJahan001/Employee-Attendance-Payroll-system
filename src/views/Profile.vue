<script setup>
import { ref } from 'vue';
import { getAuth } from "firebase/auth";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Avatar from 'primevue/avatar';
import FileUpload from 'primevue/fileupload';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const auth = getAuth();
const user = auth.currentUser;
const toast = useToast();

const profile = ref({
    name: user?.displayName || 'Admin User',
    email: user?.email || 'admin@attendance.com',
    role: 'Super Admin',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA'
});

const onUpload = () => {
    toast.add({ severity: 'info', summary: 'Success', detail: 'Avatar updated', life: 3000 });
};

const saveProfile = () => {
    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile saved successfully', life: 3000 });
};
</script>

<template>
    <div class="grid">
        <Toast />
        
        <!-- Profile Card -->
        <div class="col-12 md:col-4">
            <div class="glass p-4 h-full flex flex-column align-items-center text-center">
                <div class="relative mb-4">
                    <Avatar image="https://i.pravatar.cc/150?img=68" class="w-8rem h-8rem shadow-4" shape="circle" />
                    <Button icon="pi pi-camera" rounded severity="secondary" class="absolute bottom-0 right-0 shadow-2" style="width: 2.5rem; height: 2.5rem;" />
                </div>
                <h2 class="text-900 font-bold mb-1">{{ profile.name }}</h2>
                <span class="text-primary-600 font-medium mb-3">{{ profile.role }}</span>
                
                <div class="flex flex-wrap gap-2 mt-3 justify-content-center">
                    <Button label="Message" icon="pi pi-envelope" size="small" outlined rounded />
                    <Button label="Share" icon="pi pi-share-alt" size="small" outlined rounded />
                </div>

                <div class="w-full mt-5 border-top-1 border-gray-300 pt-4">
                    <div class="flex justify-content-between mb-3">
                        <span class="text-600">Status</span>
                        <span class="text-green-500 font-bold">Active</span>
                    </div>
                    <div class="flex justify-content-between mb-3">
                        <span class="text-600">Member Since</span>
                        <span class="text-900">Nov 2023</span>
                    </div>
                    <div class="flex justify-content-between">
                        <span class="text-600">Last Login</span>
                        <span class="text-900">Today, 09:41 AM</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="col-12 md:col-8">
            <div class="glass p-5 h-full">
                <h3 class="text-900 font-bold mb-4 flex align-items-center">
                    <i class="pi pi-user-edit mr-2 text-primary"></i>
                    Edit Profile
                </h3>
                
                <div class="grid formgrid p-fluid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="name" class="font-medium text-700">Full Name</label>
                        <InputText id="name" v-model="profile.name" class="bg-white-alpha-50" />
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="email" class="font-medium text-700">Email Address</label>
                        <InputText id="email" v-model="profile.email" class="bg-white-alpha-50" disabled />
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="phone" class="font-medium text-700">Phone Number</label>
                        <InputText id="phone" v-model="profile.phone" class="bg-white-alpha-50" />
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="location" class="font-medium text-700">Location</label>
                        <InputText id="location" v-model="profile.location" class="bg-white-alpha-50" />
                    </div>
                    <div class="field col-12 mb-4">
                        <label for="bio" class="font-medium text-700">Bio</label>
                        <textarea id="bio" rows="4" class="p-inputtext w-full bg-white-alpha-50" style="resize: none"></textarea>
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancel" severity="secondary" text />
                    <Button label="Save Changes" @click="saveProfile" />
                </div>
            </div>
        </div>
    </div>
</template>
