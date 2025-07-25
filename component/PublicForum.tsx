import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  BackHandler
} from "react-native";
import axios from "axios";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import AntDesign from "react-native-vector-icons/AntDesign";
import i18n from "i18next";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { dismiss } from "expo-router/build/global-state/routing";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "@react-navigation/native"
type PublicForumNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PublicForum"
>;

interface Post {
  id: string;
  heading: string;
  message: string;
  postimage?: Buffer;
  replyCount: string;
  timestamp: string;
  createdAt: string;
}

interface PublicForumProps {
  navigation: PublicForumNavigationProp;
}

const PublicForum: React.FC<PublicForumProps> = ({ navigation }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchText, setSearchText] = useState("");
  const [comment, setComment] = useState<{ [key: string]: string }>({}); // State for typing comments, keyed by post ID
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1); // Page number for pagination
  const [loading, setLoading] = useState(false); // Indicator for loading more posts
  const [hasMore, setHasMore] = useState(true); // Check if more posts are available
  const { t } = useTranslation();
  const screenWidth = wp(100);
  const sampleImage = require("../assets/images/news1.webp");
  const [inputHeight, setInputHeight] = useState(50);

    useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Main" as any); 
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
  
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [navigation]) 
  );
  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/get`,
          {
            params: { page, limit: 10 },
          }
        );
        if (isMounted) {
          setPosts((prevPosts) => [...prevPosts, ...response.data.posts]);
          setHasMore(response.data.posts.length === 10);
          setTimeout(() => {
            setLoading(false);
          }, 300);
        }
      } catch (error) {
        if (isMounted) {
        }
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, [page]);

useFocusEffect(
  useCallback(() => {
    const fetchPosts = async () => {
      try {
        const limit = 10;
        const response = await axios.get(
          `${environment.API_BASE_URL}api/auth/get`,
          {
            params: { page: 1, limit },
          }
        );

        if (response.data && response.data.posts) {
          setPosts(response.data.posts);
          setPage(1);
          setHasMore(response.data.posts.length === limit);
        } else {
          setPosts([]);
        }
      } catch (error) {
        Alert.alert(t("PublicForum.sorry"), t("PublicForum.failedToRefresh"));
      } finally {
        setRefreshing(false);
      }
    };

    fetchPosts();

    return () => {
      // Optional cleanup if needed
    };
  }, [])
);


  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`https://yourapi.com/posts/${id}`);
      setPosts(posts.filter((post) => post.id !== id));
    } catch (error) {}
  };

  const onRefresh = async () => {
    try {
      // setRefreshing(true);
      const limit = 10;
      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/get`,
        {
          params: { page: 1, limit },
        }
      );

      if (response.data && response.data.posts) {
        setPosts(response.data.posts);
        setPage(1);
        setHasMore(response.data.posts.length === limit);
      } else {
        setPosts([]);
      }
    } catch (error) {
      Alert.alert(t("PublicForum.sorry"), t("PublicForum.failedToRefresh"));
    } finally {
      setRefreshing(false);
    }
  };

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    dismissKeyboard();
    try {
      const replyMessage = comment[postId] || "";
      if (replyMessage.trim() === "") {
        Alert.alert(t("PublicForum.sorry"), t("PublicForum.commentEmpty"));
        return;
      }
      const replyId = "";
      const token = await AsyncStorage.getItem("userToken");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.post(
        `${environment.API_BASE_URL}api/auth/add/reply`,
        {
          chatId: postId,
          replyId: replyId,
          replyMessage: replyMessage,
        },
        { headers }
      );

      setComment((prev) => ({ ...prev, [postId]: "" }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, replyCount: String(Number(post.replyCount) + 1) }
            : post
        )
      );
    } catch (error) {
      Alert.alert(t("PublicForum.sorry"), t("PublicForum.commentFailed"));
    }
  };


  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };


const formatDate = (createdAt: string) => {
  const now = new Date();
  const postDate = new Date(createdAt);
  
  // Backend is 5 hours 27 minutes behind, so ADD this offset to correct it
  const timezoneOffset = 5 * 60 * 60 * 1000 + 27 * 60 * 1000; // 5 hours 27 minutes in milliseconds
  const correctedPostDate = new Date(postDate.getTime() + timezoneOffset);
  
  const timeDifference = now.getTime() - correctedPostDate.getTime();
  
  const minutes = Math.floor(timeDifference / (1000 * 60));
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  
  if (minutes < 1) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const language = i18n.language || "en";
    return correctedPostDate.toLocaleDateString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};


  const renderPostItem = ({ item }: { item: Post }) => {
    const postImageSource = item.postimage
      ? `${item.postimage.toString("base64")}`
      : null;

    const dynamicStyles = {
      imageMarginLeft: screenWidth < 400 ? wp(50) : wp(68),
      textMarginLeft: screenWidth < 400 ? wp(12) : wp(0),
    };

    const SkeletonLoader = () => {
      const rectHeight = hp("30%");
      const gap = hp("4%");

      return (
        <View style={{ marginTop: hp("2%"), paddingHorizontal: wp("5%") }}>
          <ContentLoader
            speed={2}
            width={wp("100%")}
            height={hp("150%")}
            viewBox={`0 0 ${wp("100%")} ${hp("150%")}`}
            backgroundColor="#ececec"
            foregroundColor="#fafafa"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <Rect
                key={`rect-${index}`} // Ensure key is unique
                x="0"
                y={index * (rectHeight + gap)} // Add gap to vertical position
                rx="12"
                ry="20"
                width={wp("90%")}
                height={rectHeight} // Maintain rectangle height
              />
            ))}
          </ContentLoader>
        </View>
      );
    };

    if (loading) {
      return <SkeletonLoader />;
    }

      const truncatedHeading = item.heading.length > 25 ? item.heading.substring(0, 25) : item.heading;

      const truncateAtWordBoundary = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return { firstPart: text, secondPart: "" };
  }
  
  // Find the last space before the max length
  let truncateIndex = maxLength;
  while (truncateIndex > 0 && text[truncateIndex] !== ' ') {
    truncateIndex--;
  }
  
  // If no space found, truncate at maxLength (fallback)
  if (truncateIndex === 0) {
    truncateIndex = maxLength;
  }
  
  const firstPart = text.substring(0, truncateIndex);
  const secondPart = text.substring(truncateIndex).replace(/^\s+/, ""); // Remove leading spaces
  
  return { firstPart, secondPart };
};

 const handleContentSizeChange = (event: { nativeEvent: { contentSize: { height: any; }; }; }) => {
    const { height } = event.nativeEvent.contentSize;
    const maxHeight = 120;
    const minHeight = 40;
    
    setInputHeight(Math.min(Math.max(height, minHeight), maxHeight));
  };

// Usage in your component:
const { firstPart, secondPart } = truncateAtWordBoundary(item.heading, 25);

    return (
      <View className="bg-white p-4 mb-4 mx-4 rounded-lg shadow-sm border border-gray-300">
        <View className="flex-row justify-between ">
          <View className="flex-1 max-w-4/5">
            <Text className="font-bold text-base overflow-hidden" numberOfLines={1}>
          {firstPart}
        </Text>
        {secondPart && (
          <Text className="font-bold text-base ">
            {secondPart}
          </Text>
            )}
          </View>
          <TouchableOpacity>
            <Text className="text-gray-500">{formatDate(item.createdAt)}</Text>
          </TouchableOpacity>
        </View>

        <View className="border border-gray-300 mt-2 rounded-lg">
          {postImageSource && (
            <Image
              source={{ uri: postImageSource }}
              className="w-full h-40 my-3 rounded-lg"
              resizeMode="contain"
            />
          )}
        </View>

        <Text className="text-gray-700 mt-3">{item.message}</Text>

        <View className="border-t border-gray-200 my-3" />

        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("PublicForumReplies", { postId: item.id })
              }
              className="mb-2 "
              style={{ marginLeft: dynamicStyles.imageMarginLeft }}
            >
              <Text
                className="text-blue-500 text-sm"
                style={{ marginLeft: dynamicStyles.textMarginLeft }}
              >
                {item.replyCount} {t("PublicForum.replies")}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center relative">
              <TextInput
                className="flex-1 text-gray-500 text-sm py-2 px-4 pr-10 border border-gray-300 rounded-full"
                placeholder={t("PublicForum.writeacomment")}
                value={comment[item.id] || ""}
                onChangeText={(text) =>
                  setComment((prev) => ({ ...prev, [item.id]: text }))
                }
                 onContentSizeChange={handleContentSizeChange}
                   style={{
            height: inputHeight,
            maxHeight: 50,
            minHeight: 50,
          
          }}
              />
              <TouchableOpacity
                className="absolute right-2 justify-center items-center "
                onPress={() => handleCommentSubmit(item.id)}
                disabled={!comment[item.id]?.trim()}
              >
                <Feather
                  name="send"
                  size={20}
                  color={!comment[item.id]?.trim() ? "lightgray" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null; // No more posts to load
    return (
      <View className="p-4">
        {loading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="gray" />
            <Text className="ml-2 text-gray-500">
              {t("PublicForum.loadingMore")}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            className="py-2 px-4 flex-row items-center justify-center"
            onPress={loadMorePosts}
          >
            <Text className="text-black font-bold">
              {t("PublicForum.viewMore")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

return (
  <View className="flex-1 bg-[#DCFBE3]">
    <View className="flex-row items-center p-4 bg-white">
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <AntDesign name="left" size={24} color="#000502" />
      </TouchableOpacity>
      <View className="flex-1 items-center flex-row justify-center">
        <View className="mr-2">
          <MaterialCommunityIcons
            name="message-processing"
            size={30}
            color="black"
          />
        </View>
        <Text className="text-lg font-semibold">
          {t("PublicForum.publicforum")}
        </Text>
      </View>
    </View>

    <View className="p-5 bg-[#DCFBE3]">
      <View className="flex-row items-center bg-white rounded-full shadow-sm">
        <TextInput
          className="flex-1 text-gray-600 px-4 py-2 text-base"
          placeholder={t("PublicForum.search")}
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
        <View className="">
          <TouchableOpacity className="bg-[#DEDEDE] rounded-full p-3">
            <Feather name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>

    <TouchableOpacity
      className="bg-green-500 rounded-full p-3 mx-4 mb-4 flex-row items-center justify-center"
      onPress={() => {
        navigation.navigate("PublicForumPost");
      }}
    >
      <Text className="text-white font-bold">
        {t("PublicForum.startanewdiscussion")}
      </Text>
      <Feather name="plus" size={26} color="white" className="ml-2" />
    </TouchableOpacity>

    {/* Check if filtered posts is empty to show LottieView */}
    {posts.filter(
      (post) =>
        (post.heading || "")
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        (post.message || "")
          .toLowerCase()
          .includes(searchText.toLowerCase())
    ).length === 0 && !loading ? (
      <View className="flex-1 items-center justify-center">
        <LottieView
          source={require('../assets/jsons/NoComplaints.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text className="text-gray-500 text-center mt-4 px-6">
          {searchText.trim() !== '' 
            ? t("PublicForum.noSearchResults") || "No results found for your search"
            : t("PublicForum.noDiscussions") || "No discussions available"
          }
        </Text>
      </View>
    ) : (
      // <FlatList
      //   keyboardShouldPersistTaps="handled"
      //   data={posts.filter(
      //     (post) =>
      //       (post.heading || "")
      //         .toLowerCase()
      //         .includes(searchText.toLowerCase()) ||
      //       (post.message || "")
      //         .toLowerCase()
      //         .includes(searchText.toLowerCase())
      //   )}
      //   keyExtractor={(item) => item.id}
      //   renderItem={renderPostItem}
      //   refreshing={refreshing}
      //   onRefresh={onRefresh}
      //   ListFooterComponent={renderFooter}
      //   refreshControl={
      //     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      //   }
      // />
      <FlatList
  data={posts.filter(
    (post) =>
      (post.heading || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      (post.message || "")
        .toLowerCase()
        .includes(searchText.toLowerCase())
  )}
  keyExtractor={(item, index) => `${item.id}-${index}`} // Adding index for uniqueness
  renderItem={renderPostItem}
  refreshing={refreshing}
  onRefresh={onRefresh}
  ListFooterComponent={renderFooter}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
/>

    )}
  </View>
);
};

export default PublicForum;
