'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface FamilyMember {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface FamilyContextType {
  members: FamilyMember[];
  currentMember: FamilyMember | null;
  setCurrentMember: (member: FamilyMember) => void;
  addMember: (name: string, emoji: string, color: string) => Promise<FamilyMember>;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
}

const FamilyContext = createContext<FamilyContextType>({
  members: [],
  currentMember: null,
  setCurrentMember: () => {},
  addMember: async () => ({ id: '', name: '', emoji: '', color: '' }),
  showPicker: false,
  setShowPicker: () => {},
});

export function useFamilyMember() {
  return useContext(FamilyContext);
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMemberState] = useState<FamilyMember | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data);
    return data;
  }, []);

  useEffect(() => {
    fetchMembers().then((data: FamilyMember[]) => {
      const savedId = localStorage.getItem('family-member-id');
      if (savedId) {
        const found = data.find((m: FamilyMember) => m.id === savedId);
        if (found) setCurrentMemberState(found);
      }
      setLoaded(true);
    });
  }, [fetchMembers]);

  // Show picker if no member selected after load
  useEffect(() => {
    if (loaded && !currentMember && members.length > 0) {
      setShowPicker(true);
    }
  }, [loaded, currentMember, members.length]);

  const setCurrentMember = (member: FamilyMember) => {
    setCurrentMemberState(member);
    localStorage.setItem('family-member-id', member.id);
    setShowPicker(false);
  };

  const addMember = async (name: string, emoji: string, color: string) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, color }),
    });
    const member = await res.json();
    setMembers((prev) => [...prev, member]);
    setCurrentMember(member);
    return member;
  };

  return (
    <FamilyContext.Provider value={{
      members, currentMember, setCurrentMember, addMember, showPicker, setShowPicker,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}
