import { View, Text } from "react-native"
import FeedScreen from "../feed/feed-screen"
import FloatingAddButton from "@/src/components/ui/floating-add-button"
import CreatePostModal from "@/src/components/ui/create-post-modal"
import { useState } from "react"
import { router } from "expo-router"
import MediaPermissionModal from "@/src/components/ui/media-permission-modal"
import { SafeAreaView } from "react-native-safe-area-context"




export default function HomeScreen() {
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'photos'>('photos');


   const handleSelectCamera = () => {
    setPermissionType('camera');
    setPermissionVisible(true);
  };

  const handleSelectLibrary = () => {
    setPermissionType('photos');
    setPermissionVisible(true);
  };

  const handleSelectVideo = () => {
    setPermissionType('camera');
    setPermissionVisible(true);
  };

  const handleAllowAccess = () => {
      setPermissionVisible(false);
    if (permissionType === 'photos' || permissionType === 'camera') {
      router.push('/feed/media-selection-screen');
    } else {
      // Open camera
      console.log('Open camera');
    }
  };

  const handleDenyAccess = () => {
    setPermissionVisible(false);
    // Handle denied permission
    console.log('Permission denied');
  };

  return (

   <SafeAreaView >
    <Text className='font-[Camood] text-3xl text-black mx-5'>uniCLIQ</Text>
  <FeedScreen />
  <FloatingAddButton onPress={() => setCreatePostVisible(true)} />
  
  <CreatePostModal
    visible={createPostVisible}
    onClose={() => setCreatePostVisible(false)}
    onSelectCamera={handleSelectCamera}
    onSelectLibrary={handleSelectLibrary}
    onSelectVideo={handleSelectVideo}
  />

  {permissionVisible && (
    <MediaPermissionModal
      visible={permissionVisible}
      permissionType={permissionType}
      onAllowAccess={handleAllowAccess}
      onDenyAccess={handleDenyAccess}
      onClose={() => setPermissionVisible(false)}
    />
  )}
</SafeAreaView>

  );
}
