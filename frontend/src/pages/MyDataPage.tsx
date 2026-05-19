import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserButton, useUser } from '@clerk/clerk-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import {
  defaultProfile,
  loadProfile,
  saveProfile as persistProfile,
  type UserProfile,
} from '@/services/profile';

const MyDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newAvoid, setNewAvoid] = useState('');

  const fetchOrCreateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setSuccess(null);

    const data = await loadProfile(user.id);
    if (data) {
      setProfile({
        id: data.id,
        age: data.age ?? null,
        gender: data.gender ?? '',
        past_medication: Array.isArray(data.past_medication) ? data.past_medication : [],
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        avoid_list: Array.isArray(data.avoid_list) ? data.avoid_list : [],
        diet_type: data.diet_type ?? '',
      });
    } else {
      setProfile(defaultProfile(user.id));
    }

    setLoading(false);
  };

  const saveProfile = async (next?: Partial<UserProfile>) => {
    if (!profile) return;

    setSaving(true);
    setSuccess(null);

    const toSave = { ...profile, ...(next || {}) } as UserProfile;
    const ok = await persistProfile(toSave);

    if (ok) {
      setProfile(toSave);
      if (user) {
        localStorage.setItem(`hasCompletedOnboarding_${user.id}`, 'true');
      }
      setSuccess('Profile saved successfully!');
      toast({ title: 'Success', description: 'Your profile has been updated.', variant: 'default' });
    } else {
      toast({
        title: 'Save failed',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    }

    setSaving(false);
  };

  useEffect(() => { fetchOrCreateProfile(); }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 to-teal-50/40 dark:from-background dark:via-emerald-950/20 dark:to-teal-950/30 pt-8 pb-16">
      {/* Global top bar with back button aligned left */}
      <div className="container mx-auto px-4 py-2">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        >
          Back to home
        </button>
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">My Profile</h1>
          {isSignedIn && <UserButton afterSignOutUrl="/" />}
        </div>

        <div className="space-y-6">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Loading your profile...
              </AlertDescription>
            </Alert>
          )}

          {/* Basics */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-background p-5">
            <h2 className="font-semibold mb-4">Basics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-foreground/70">Age</label>
                <Input
                  type="number"
                  value={profile?.age === null ? '' : String(profile?.age)}
                  onChange={(e) => setProfile(p => p ? { ...p, age: e.target.value === '' ? null : Number(e.target.value) } : p)}
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70">Gender</label>
                <select
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  value={profile?.gender || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, gender: e.target.value } : p)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-foreground/70">Diet Type</label>
                <select
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  value={profile?.diet_type || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, diet_type: e.target.value } : p)}
                >
                  <option value="">Select</option>
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non-veg">NonΓÇæveg</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chips Editors */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-background p-5">
            <h2 className="font-semibold mb-4">Health Preferences</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-foreground/70">Past Medications</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.past_medication.map((m, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">{m}
                      <button className="ml-2" onClick={() => setProfile(p => p ? { ...p, past_medication: p.past_medication.filter((_, idx) => idx !== i) } : p)}>├ù</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add medication and press Enter" value={newMed} onChange={(e) => setNewMed(e.target.value)} onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMed.trim() && profile) {
                      setProfile({ ...profile, past_medication: [...profile.past_medication, newMed.trim()] });
                      setNewMed('');
                    }
                  }} />
                  <Button variant="outline" onClick={() => { if (newMed.trim() && profile) { setProfile({ ...profile, past_medication: [...profile.past_medication, newMed.trim()] }); setNewMed(''); } }}>Add</Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground/70">Allergies</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.allergies.map((m, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs">{m}
                      <button className="ml-2" onClick={() => setProfile(p => p ? { ...p, allergies: p.allergies.filter((_, idx) => idx !== i) } : p)}>├ù</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add allergy and press Enter" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAllergy.trim() && profile) {
                      setProfile({ ...profile, allergies: [...profile.allergies, newAllergy.trim()] });
                      setNewAllergy('');
                    }
                  }} />
                  <Button variant="outline" onClick={() => { if (newAllergy.trim() && profile) { setProfile({ ...profile, allergies: [...profile.allergies, newAllergy.trim()] }); setNewAllergy(''); } }}>Add</Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground/70">Avoid List</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.avoid_list.map((m, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">{m}
                      <button className="ml-2" onClick={() => setProfile(p => p ? { ...p, avoid_list: p.avoid_list.filter((_, idx) => idx !== i) } : p)}>├ù</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add item and press Enter" value={newAvoid} onChange={(e) => setNewAvoid(e.target.value)} onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAvoid.trim() && profile) {
                      setProfile({ ...profile, avoid_list: [...profile.avoid_list, newAvoid.trim()] });
                      setNewAvoid('');
                    }
                  }} />
                  <Button variant="outline" onClick={() => { if (newAvoid.trim() && profile) { setProfile({ ...profile, avoid_list: [...profile.avoid_list, newAvoid.trim()] }); setNewAvoid(''); } }}>Add</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => fetchOrCreateProfile()} disabled={loading}>{loading ? 'RefreshingΓÇª' : 'Refresh'}</Button>
            <Button onClick={() => saveProfile()} disabled={saving || !profile}>{saving ? 'SavingΓÇª' : 'Save Profile'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDataPage;
