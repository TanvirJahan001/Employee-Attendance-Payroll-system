<script setup>
import { ref, computed } from 'vue';
import { getAuth, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuthStore } from '../stores/authStore';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Avatar from 'primevue/avatar';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const auth = getAuth();
const authStore = useAuthStore();
const toast = useToast();

const profile = ref({
    name: '',
    phone: '',
    location: '',
    bio: '',
});

const nameError = ref('');
const phoneError = ref('');
const saving = ref(false);

// Load profile from Firestore on mount
const loadProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    profile.value.name = user.displayName || '';

    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
            const data = snap.data();
            profile.value.phone = data.phone || '';
            profile.value.location = data.location || '';
            profile.value.bio = data.bio || '';
        }
    } catch {
        // Non-critical; proceed with defaults
    }
};
loadProfile();

const userEmail = computed(() => auth.currentUser?.email || '');
const memberSince = computed(() => {
    const created = auth.currentUser?.metadata?.creationTime;
    return created ? new Date(created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
});
const lastLogin = computed(() => {
    const last = auth.currentUser?.metadata?.lastSignInTime;
    return last ? new Date(last).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
});

const PHONE_REGEX = /^[+\d\s\-().]{7,20}$/;
const MAX_BIO_LENGTH = 500;

const validate = () => {
    nameError.value = '';
    phoneError.value = '';
    let valid = true;

    const trimmedName = profile.value.name.trim();
    if (!trimmedName) {
        nameError.value = 'Name is required.';
        valid = false;
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
        nameError.value = 'Name must be 2–80 characters.';
        valid = false;
    }

    if (profile.value.phone && !PHONE_REGEX.test(profile.value.phone)) {
        phoneError.value = 'Enter a valid phone number.';
        valid = false;
    }

    if (profile.value.bio && profile.value.bio.length > MAX_BIO_LENGTH) {
        toast.add({ severity: 'warn', summary: 'Bio too long', detail: `Maximum ${MAX_BIO_LENGTH} characters.`, life: 3000 });
        valid = false;
    }

    return valid;
};

const saveProfile = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) return;

    saving.value = true;
    try {
        // Update Firebase display name
        await updateProfile(user, { displayName: profile.value.name.trim() });

        // Persist extra fields to Firestore (not sensitive business data)
        await setDoc(doc(db, 'users', user.uid), {
            phone: profile.value.phone.trim(),
            location: profile.value.location.trim(),
            bio: profile.value.bio.trim().substring(0, MAX_BIO_LENGTH),
        }, { merge: true });

        toast.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated successfully.', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save profile. Please try again.', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const onUpload = (event) => {
    const file = event.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

    if (!ALLOWED_TYPES.includes(file.type)) {
        toast.add({ severity: 'error', summary: 'Invalid file', detail: 'Only JPEG, PNG, or WebP images allowed.', life: 3000 });
        return;
    }
    if (file.size > MAX_SIZE_BYTES) {
        toast.add({ severity: 'error', summary: 'File too large', detail: 'Maximum file size is 2 MB.', life: 3000 });
        return;
    }
    toast.add({ severity: 'info', summary: 'Info', detail: 'Avatar upload requires storage configuration.', life: 3000 });
};
</script>

<template>
    <div class="grid">
        <Toast />

        <!-- Profile Card -->
        <div class="col-12 md:col-4">
            <div class="glass p-4 h-full flex flex-column align-items-center text-center">
                <div class="relative mb-4">
                    <!-- Initials avatar — no external service -->
                    <Avatar
                        :label="authStore.userInitials"
                        class="w-8rem h-8rem shadow-4 text-4xl font-bold"
                        style="background-color: var(--primary-500); color: #fff;"
                        shape="circle"
                    />
                    <Button
                        icon="pi pi-camera"
                        rounded
                        severity="secondary"
                        class="absolute bottom-0 right-0 shadow-2"
                        style="width: 2.5rem; height: 2.5rem;"
                        @click="$refs.fileInput.click()"
                        title="Change avatar"
                    />
                    <!-- Hidden file input with strict restrictions -->
                    <input
                        ref="fileInput"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style="display:none"
                        @change="onUpload({ files: $event.target.files })"
                    />
                </div>
                <h2 class="text-900 font-bold mb-1">{{ authStore.userDisplayName }}</h2>
                <span class="text-primary-600 font-medium mb-3">{{ authStore.isAdmin ? 'Admin' : 'Employee' }}</span>

                <div class="w-full mt-5 border-top-1 border-gray-300 pt-4">
                    <div class="flex justify-content-between mb-3">
                        <span class="text-600">Status</span>
                        <span class="text-green-500 font-bold">Active</span>
                    </div>
                    <div class="flex justify-content-between mb-3">
                        <span class="text-600">Member Since</span>
                        <span class="text-900">{{ memberSince }}</span>
                    </div>
                    <div class="flex justify-content-between">
                        <span class="text-600">Last Login</span>
                        <span class="text-900">{{ lastLogin }}</span>
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
                        <InputText id="name" v-model="profile.name" :class="{ 'p-invalid': nameError }" class="bg-white-alpha-50" maxlength="80" />
                        <small v-if="nameError" class="p-error">{{ nameError }}</small>
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="email" class="font-medium text-700">Email Address</label>
                        <!-- Email is read-only; change requires re-auth via Firebase -->
                        <InputText id="email" :value="userEmail" class="bg-white-alpha-50" disabled />
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="phone" class="font-medium text-700">Phone Number</label>
                        <InputText id="phone" v-model="profile.phone" :class="{ 'p-invalid': phoneError }" class="bg-white-alpha-50" maxlength="20" placeholder="+1 (555) 000-0000" />
                        <small v-if="phoneError" class="p-error">{{ phoneError }}</small>
                    </div>
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="location" class="font-medium text-700">Location</label>
                        <InputText id="location" v-model="profile.location" class="bg-white-alpha-50" maxlength="100" />
                    </div>
                    <div class="field col-12 mb-4">
                        <label for="bio" class="font-medium text-700">Bio</label>
                        <textarea
                            id="bio"
                            v-model="profile.bio"
                            rows="4"
                            maxlength="500"
                            class="p-inputtext w-full bg-white-alpha-50"
                            style="resize: none"
                        ></textarea>
                        <small class="text-500">{{ profile.bio.length }}/500</small>
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <Button label="Cancel" severity="secondary" text @click="loadProfile" />
                    <Button label="Save Changes" :loading="saving" @click="saveProfile" />
                </div>
            </div>
        </div>
    </div>
</template>
