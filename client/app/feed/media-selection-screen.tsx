import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MediaSelectionScreenProps {
  navigation?: any;
}

const MediaSelectionScreen: React.FC<MediaSelectionScreenProps> = ({ navigation }) => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 48) / 3; // 3 columns with padding

  // Mock media data - in real app, this would come from device gallery
  const mediaItems = [
    { id: '1', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop', type: 'image' },
    { id: '2', uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop', type: 'image' },
    { id: '3', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop', type: 'video' },
    { id: '4', uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=300&fit=crop', type: 'image' },
    { id: '5', uri: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=300&h=300&fit=crop', type: 'image' },
    { id: '6', uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=300&fit=crop', type: 'image' },
  ];

  const handleNext = () => {
    if (selectedMedia) {
      router.push('/feed/compose-post-screen');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-blue-600 text-base">Cancel</Text>
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">Select Photo</Text>
        <TouchableOpacity onPress={handleNext} disabled={!selectedMedia}>
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className={`text-base font-semibold ${selectedMedia ? 'text-blue-600' : 'text-gray-400'}`}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      {selectedMedia && (
        <View className="h-80 bg-black">
          <Image
            source={{ uri: selectedMedia }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
      )}

      {/* Gallery Grid */}
      <ScrollView className="flex-1 px-4 py-4">
        <View className="flex-row flex-wrap justify-between">
          {mediaItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedMedia(item.uri)}
              className="mb-2"
              style={{ width: itemSize, height: itemSize }}
            >
              <View className="relative">
                <Image
                  source={{ uri: item.uri }}
                  className="w-full h-full rounded-lg"
                  resizeMode="cover"
                />
                
                {/* Video indicator */}
                {item.type === 'video' && (
                  <View className="absolute top-2 right-2">
                    <Ionicons name="videocam" size={16} color="white" />
                  </View>
                )}

                {/* Selection indicator */}
                {selectedMedia === item.uri && (
                  <View className="absolute inset-0 bg-blue-600 bg-opacity-30 rounded-lg items-center justify-center">
                    <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MediaSelectionScreen;


// import { Ionicons } from '@expo/vector-icons';
// import * as MediaLibrary from 'expo-media-library';
// import { router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//     Alert,
//     Dimensions,
//     Image,
//     SafeAreaView,
//     ScrollView,
//     StatusBar,
//     Text,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// const MediaSelectionScreen = () => {
//   const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
//   const [mediaItems, setMediaItems] = useState<MediaLibrary.Asset[]>([]);
//   const screenWidth = Dimensions.get('window').width;
//   const itemSize = (screenWidth - 48) / 3;

//   useEffect(() => {
//     (async () => {
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Please allow access to media library.');
//         return;
//       }

//       const media = await MediaLibrary.getAssetsAsync({
//         mediaType: ['photo', 'video'],
//         first: 50,
//         sortBy: [[MediaLibrary.SortBy.creationTime, false]],
//       });

//       setMediaItems(media.assets);
//     })();
//   }, []);

//   const handleNext = () => {
//     if (selectedMedia) {
//       router.push('/screens/home/compose-post-screen');
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <StatusBar barStyle="dark-content" />

//       {/* Header */}
//       <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-blue-600 text-base">Cancel</Text>
//         </TouchableOpacity>
//         <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg font-semibold text-black">Select Photo</Text>
//         <TouchableOpacity onPress={handleNext} disabled={!selectedMedia}>
//           <Text
//             style={{ fontFamily: 'Gilroy-SemiBold' }}
//             className={`text-base font-semibold ${selectedMedia ? 'text-blue-600' : 'text-gray-400'}`}
//           >
//             Next
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Preview */}
//       {selectedMedia && (
//         <View className="h-80 bg-black">
//           <Image
//             source={{ uri: selectedMedia }}
//             className="w-full h-full"
//             resizeMode="contain"
//           />
//         </View>
//       )}

//       {/* Gallery Grid */}
//       <ScrollView className="flex-1 px-4 py-4">
//         <View className="flex-row flex-wrap justify-between">
//           {mediaItems.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               onPress={() => setSelectedMedia(item.uri)}
//               className="mb-2"
//               style={{ width: itemSize, height: itemSize }}
//             >
//               <View className="relative">
//                 <Image
//                   source={{ uri: item.uri }}
//                   className="w-full h-full rounded-lg"
//                   resizeMode="cover"
//                 />

//                 {/* Video indicator */}
//                 {item.mediaType === 'video' && (
//                   <View className="absolute top-2 right-2">
//                     <Ionicons name="videocam" size={16} color="white" />
//                   </View>
//                 )}

//                 {/* Selection indicator */}
//                 {selectedMedia === item.uri && (
//                   <View className="absolute inset-0 bg-blue-600 bg-opacity-30 rounded-lg items-center justify-center">
//                     <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
//                       <Ionicons name="checkmark" size={16} color="white" />
//                     </View>
//                   </View>
//                 )}
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default MediaSelectionScreen;
