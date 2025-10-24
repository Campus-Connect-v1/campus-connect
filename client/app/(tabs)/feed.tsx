// // import { View, Text } from "react-native"
// // import FeedScreen from "../feed/feed-screen"
// // import FloatingAddButton from "@/src/components/ui/floating-add-button"
// // import CreatePostModal from "@/src/components/ui/create-post-modal"
// // import { useState } from "react"
// // import { router } from "expo-router"
// // import MediaPermissionModal from "@/src/components/ui/media-permission-modal"
// // import { SafeAreaView } from "react-native-safe-area-context"




// // export default function HomeScreen() {
// //   const [createPostVisible, setCreatePostVisible] = useState(false);
// //   const [permissionVisible, setPermissionVisible] = useState(false);
// //   const [permissionType, setPermissionType] = useState<'camera' | 'photos'>('photos');


// //    const handleSelectCamera = () => {
// //     setPermissionType('camera');
// //     setPermissionVisible(true);
// //   };

// //   const handleSelectLibrary = () => {
// //     setPermissionType('photos');
// //     setPermissionVisible(true);
// //   };

// //   const handleSelectVideo = () => {
// //     setPermissionType('camera');
// //     setPermissionVisible(true);
// //   };

// //   const handleAllowAccess = () => {
// //       setPermissionVisible(false);
// //     if (permissionType === 'photos' || permissionType === 'camera') {
// //       router.push('/feed/media-selection-screen');
// //     } else {
// //       // Open camera
// //       console.log('Open camera');
// //     }
// //   };

// //   const handleDenyAccess = () => {
// //     setPermissionVisible(false);
// //     // Handle denied permission
// //     console.log('Permission denied');
// //   };

// //   return (

// //    <SafeAreaView >
// //     <Text className='font-[Chillis] text-2xl text-black'>uniCLIQ</Text>
// //   <FeedScreen />
// //   <FloatingAddButton onPress={() => setCreatePostVisible(true)} />
  
// //   <CreatePostModal
// //     visible={createPostVisible}
// //     onClose={() => setCreatePostVisible(false)}
// //     onSelectCamera={handleSelectCamera}
// //     onSelectLibrary={handleSelectLibrary}
// //     onSelectVideo={handleSelectVideo}
// //   />

// //   {permissionVisible && (
// //     <MediaPermissionModal
// //       visible={permissionVisible}
// //       permissionType={permissionType}
// //       onAllowAccess={handleAllowAccess}
// //       onDenyAccess={handleDenyAccess}
// //       onClose={() => setPermissionVisible(false)}
// //     />
// //   )}
// // </SafeAreaView>

// //   );
// // }



import React, { useState } from "react"
import { View, Text, StyleSheet, ImageBackground } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { router } from "expo-router"

import FeedScreen from "../feed/feed-screen"
import FloatingAddButton from "@/src/components/ui/floating-add-button"
import CreatePostModal from "@/src/components/ui/create-post-modal"
import MediaPermissionModal from "@/src/components/ui/media-permission-modal"

export default function HomeScreen() {
  const [createPostVisible, setCreatePostVisible] = useState(false)
  const [permissionVisible, setPermissionVisible] = useState(false)
  const [permissionType, setPermissionType] = useState<"camera" | "photos">("photos")

  const handleSelectCamera = () => {
    setPermissionType("camera")
    setPermissionVisible(true)
  }

  const handleSelectLibrary = () => {
    setPermissionType("photos")
    setPermissionVisible(true)
  }

  const handleSelectVideo = () => {
    setPermissionType("camera")
    setPermissionVisible(true)
  }

  const handleAllowAccess = () => {
    setPermissionVisible(false)
    if (permissionType === "photos" || permissionType === "camera") {
      router.push("/feed/media-selection-screen")
    } else {
      console.log("Open camera")
    }
  }

  const handleDenyAccess = () => {
    setPermissionVisible(false)
    console.log("Permission denied")
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title */}
      <Text className="font-[Camood] text-3xl text-black mx-5 mt-2">Feed</Text>

      {/* Background Layer */}
      <ImageBackground
        source={require("@/assets/images/background2.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <BlurView intensity={0} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.contentContainer}>
          <FeedScreen />
          <FloatingAddButton onPress={() => setCreatePostVisible(true)} />
        </View>
      </ImageBackground>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSelectCamera={handleSelectCamera}
        onSelectLibrary={handleSelectLibrary}
        onSelectVideo={handleSelectVideo}
      />

      {/* Media Permission Modal */}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  background: {

  },
  contentContainer: {
  

  }
})



// "use client"

// import { useState } from "react"
// import { View, Text, StyleSheet, ImageBackground } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { BlurView } from "expo-blur"
// import { router } from "expo-router"

// import FeedScreen from "../feed/feed-screen"
// import FloatingAddButton from "@/src/components/ui/floating-add-button"
// import CreatePostModal from "@/src/components/ui/create-post-modal"
// import MediaPermissionModal from "@/src/components/ui/media-permission-modal"

// export default function HomeScreen() {
//   const [createPostVisible, setCreatePostVisible] = useState(false)
//   const [permissionVisible, setPermissionVisible] = useState(false)
//   const [permissionType, setPermissionType] = useState<"camera" | "photos">("photos")

//   const handleSelectCamera = () => {
//     setPermissionType("camera")
//     setPermissionVisible(true)
//   }

//   const handleSelectLibrary = () => {
//     setPermissionType("photos")
//     setPermissionVisible(true)
//   }

//   const handleSelectVideo = () => {
//     setPermissionType("camera")
//     setPermissionVisible(true)
//   }

//   const handleAllowAccess = () => {
//     setPermissionVisible(false)
//     if (permissionType === "photos" || permissionType === "camera") {
//       router.push("/feed/media-selection-screen")
//     } else {
//       console.log("Open camera")
//     }
//   }

//   const handleDenyAccess = () => {
//     setPermissionVisible(false)
//     console.log("Permission denied")
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ImageBackground source={require("@/assets/images/background2.png")} style={styles.background} resizeMode="cover">
//         <BlurView intensity={0} tint="light" style={StyleSheet.absoluteFill} />

//         <View style={styles.header}>
//           <Text style={styles.title}>Feed</Text>
//         </View>

//         <View style={styles.contentContainer}>
//           <FeedScreen />
//           <FloatingAddButton onPress={() => setCreatePostVisible(true)} />
//         </View>
//       </ImageBackground>

//       <CreatePostModal
//         visible={createPostVisible}
//         onClose={() => setCreatePostVisible(false)}
//         onSelectCamera={handleSelectCamera}
//         onSelectLibrary={handleSelectLibrary}
//         onSelectVideo={handleSelectVideo}
//       />

//       {permissionVisible && (
//         <MediaPermissionModal
//           visible={permissionVisible}
//           permissionType={permissionType}
//           onAllowAccess={handleAllowAccess}
//           onDenyAccess={handleDenyAccess}
//           onClose={() => setPermissionVisible(false)}
//         />
//       )}
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   background: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#000",
//     fontFamily: "Camood",
//   },
//   contentContainer: {
//     flex: 1,
//   },
// })
