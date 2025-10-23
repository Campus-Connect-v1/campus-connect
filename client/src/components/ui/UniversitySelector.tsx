import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import CustomDropdown from './custom-dropdown';
import React, { useState } from 'react';
import { View, Text } from 'react-native';

interface University {
  university_id: string;
  label: string;
  value: string; // domain
}

const UniversitySelector = ({onSelectUniversity}: any) => {
  const { data, error, isLoading } = useSWR('/university/domains', fetcher);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  if (isLoading) return <Text>Loading universities...</Text>;
  if (error) return <Text>Error loading universities</Text>;

  // Safely access the array
  const universities = Array.isArray(data?.universities) ? data.universities : [];

  const options = universities.map((uni: University) => ({
    label: uni.label,
    value: uni.university_id,
  }));

  const handleSelect = (uniId: string) => {
    const uni = universities.find((u: University) => u.university_id === uniId);
    if (uni) {
      setSelectedUniversity(uni);
      onSelectUniversity?.(uni); // send up to parent
    }
  };

  return (
    <View style={{ marginTop: 16 }}>
      <CustomDropdown
        options={options}
        onSelect={handleSelect}
        selectedValue={selectedUniversity?.university_id}
        placeholder="Select your university"
      />
      {selectedUniversity && (
        <Text className='font-[Gilroy-Regular]' style={{ marginTop: 10, color: '#fff', textAlign: 'center' }}>
          Your email domain will be:{' '}
          <Text className='font-[Gilroy-SemiBold]' style={{ fontWeight: 'bold' }}>@{selectedUniversity.value}</Text>
        </Text>
      )}
    </View>
  );
};

export default UniversitySelector;
