import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const MediaSelectionScreen = () => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaLibrary.Asset[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 48) / 3;

  // Request permission and load media
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to media library.');
        return;
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        first: 200,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      setMediaItems(media.assets);
    })();
  }, []);

  // Resolve local URI for selected media
  const handleSelectMedia = async (asset: MediaLibrary.Asset) => {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      setSelectedMedia(info.localUri || asset.uri);
    } catch (e) {
      console.error('Failed to get asset info', e);
      Alert.alert('Error', 'Cannot load this media.');
    }
  };

const handleNext = () => {
  if (selectedMedia) {
    router.push(`/feed/compose-post-screen?media=${encodeURIComponent(selectedMedia)}`);
  }
};


  // Component to render each media thumbnail
  const MediaThumbnail = ({ asset }: { asset: MediaLibrary.Asset }) => {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        setUri(info.localUri || asset.uri);
      })();
    }, [asset]);

    if (!uri) return <View style={{ backgroundColor: '#ccc', flex: 1 }} />;

    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%', borderRadius: 8 }}
        contentFit="cover"
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: '#e5e5e5',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontFamily: 'Gilroy-Regular', color: '#3b82f6', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Gilroy-SemiBold', fontSize: 18, color: '#000' }}>Select Photo</Text>

        <TouchableOpacity onPress={handleNext} disabled={!selectedMedia}>
          <Text
            style={{
              fontFamily: 'Gilroy-SemiBold',
              fontSize: 16,
              color: selectedMedia ? '#3b82f6' : '#9ca3af',
            }}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Media Preview */}
      {selectedMedia && (
        <View style={{ height: 320, backgroundColor: '#000' }}>
          <Image
            source={{ uri: selectedMedia }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        </View>
      )}

      {/* Gallery Grid */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {mediaItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelectMedia(item)}
              style={{
                width: itemSize,
                height: itemSize,
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, position: 'relative' }}>
                <MediaThumbnail asset={item} />

                {/* Video indicator */}
                {item.mediaType === 'video' && (
                  <View style={{ position: 'absolute', top: 4, right: 4 }}>
                    <Ionicons name="videocam" size={16} color="white" />
                  </View>
                )}

                {/* Selection overlay */}
                {selectedMedia === item.uri && (
                  <View
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(59, 130, 246, 0.3)',
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#3b82f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
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
