import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import NewsSlideShow from "@/Items/NewsSlideShow";
import MarketPriceSlideShow from "@/Items/MarketPriceSlideShow";
import { RootStackParamList } from "./types";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useTranslation } from "react-i18next";
import { useIsFocused } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { BackHandler } from "react-native";
import DashboardSkeleton from "@/Skeleton/DashboardSkeleton";

type DashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Lanuage"
>;

interface User {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  NICnumber?: string;
  profileImage?: string;
}

interface DashboardProps {
  navigation: DashboardNavigationProp;
}

const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState("en");
  const { t } = useTranslation();
  const isFocused = useIsFocused();

  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const screenWidth = wp(100);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        return true; // Disable back button
      };

      BackHandler.addEventListener("hardwareBackPress", backAction);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", backAction);
    }, [])
  );

   useEffect(() => {
      const checkTokenExpiration = async () => {
        try {
          const expirationTime = await AsyncStorage.getItem(
            "tokenExpirationTime"
          );
          const userToken = await AsyncStorage.getItem("userToken");
  
          if (expirationTime && userToken) {
            const currentTime = new Date();
            const tokenExpiry = new Date(expirationTime);
  
            if (currentTime < tokenExpiry) {
              console.log("Token is valid");
            } else {
              console.log("Token expired, clearing storage.");
              await AsyncStorage.multiRemove([
                "userToken",
                "tokenStoredTime",
                "tokenExpirationTime",
              ]);
              navigation.navigate("Signin");
            }
          }
        } catch (error) {
          console.error("Error checking token expiration:", error);
          navigation.navigate("Signin");
        }
      };
  
      checkTokenExpiration();
    }, [navigation]);

  // useEffect(() => {
    // const selectedLanguage = t("Dashboard.LNG");
    // setLanguage(selectedLanguage);

  //   const fetchProfileData = async () => {
  //     try {
  //       const response = await fetch(
  //         `${environment.API_BASE_URL}api/auth/user-profile`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${await AsyncStorage.getItem(
  //               "userToken"
  //             )}`,
  //           },
  //         }
  //       );
  //       const data = await response.json();
  //       setUser(data.user);
        // setTimeout(() => {
        //   setLoading(false);
        // }, 300);
  //     } catch (error) {
  //       Alert.alert(t("Main.error"), t("Main.somethingWentWrong"));
  //       navigation.navigate("Signin");
  //     }
  //   };

  //   if (isFocused) {
  //     fetchProfileData();
  //   }
  // }, [isFocused]);

  const fetchProfileData = async () => {
    const selectedLanguage = t("Dashboard.LNG");
    setLanguage(selectedLanguage);
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/user-profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("userToken")}`,
          },
        }
      );
      const data = await response.json();
      if (!data.user || !data.user.firstName) {
        Alert.alert(t("Main.error"), t("Main.somethingWentWrong"));
        navigation.navigate("Signin");
        return; 
      }
      setUser(data.user);
      setTimeout(() => {
        setLoading(false);
      }, 300);
      } catch (error) {
      Alert.alert(t("Main.error"), t("Main.somethingWentWrong"));
      navigation.navigate("Signin");
    }
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setLoading(true); // Set loading to true when refresh is triggered
    await fetchProfileData(); // Re-fetch profile data
  };

  useEffect(() => {
    if (isFocused) {
      fetchProfileData(); // Fetch data when the screen is focused
    }
  }, [isFocused]);

  const handleWeatherNavigation = () => {
    if (language === "en") {
      // navigation.navigate("TransactionHistory" as any);
      navigation.navigate("WeatherForecastEng");
    } else if (language === "si") {
      navigation.navigate("WeatherForecastSinhala");
    } else if (language === "ta") {
      navigation.navigate("WeatherForecastTamil");
    }
  };

  const dynamicStyles = {
    imageSize: screenWidth < 400 ? wp(6) : wp(8),
    buttonWidth: screenWidth < 400 ? wp(38) : wp(35),
    buttonHeight: screenWidth < 400 ? wp(28) : wp(28),
    iconSize: screenWidth < 400 ? 50 : 50,
    textSize: screenWidth < 400 ? 14 : 14,
    paddingTopSlideshow: screenWidth < 400 ? 80 : 80,
    slideShowTitleSize: screenWidth < 400 ? 15 : 20,
    paddingFromProfileImage: screenWidth < 400 ? 10 : 20,
    paddingTopForCards: screenWidth < 400 ? 60 : 60,
  };

  if (loading) {
    return <DashboardSkeleton />;
  }
  return (
    <SafeAreaView className="flex-1 bg-white ">
      <StatusBar style="auto" />
      <ImageBackground
        source={require("../assets/images/Group.webp")}
        style={{ flex: 1, width: wp(100), height: hp(20) }}
      >
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => navigation.navigate("EngProfile")}>
            <View style={{ position: "relative" }}>
              <Image
                source={
                  user && user.profileImage
                    ? { uri: user.profileImage }
                    : require("../assets/images/pcprofile 1.webp")
                }
                style={{
                  height: 50,
                  width: 50,
                  borderRadius: hp(4),
                  marginLeft: 15,
                  marginTop: 15,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 13,
                  right: 4,
                  height: 15,
                  width: 15,
                  borderRadius: 7.5,
                  backgroundColor: isConnected ? "#00ff00" : "#808080",
                  borderWidth: 2,
                  borderColor: "white",
                }}
              />
            </View>
          </TouchableOpacity>
          {/* <View style={{ marginTop: 20, marginLeft: 15 }}>
            <Text style={{ fontSize: 15, fontWeight: "bold" }}>
              {t("Dashboard.hi")},{" "}
              {user ? `${user.firstName} ✋🏻` : `${t("Dashboard.loading")}`}
            </Text>
          </View> */}
          <View style={{ marginTop: 15, marginLeft: 15, flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "bold", flexWrap: "wrap" }}
            >
              {t("Dashboard.hi")},{" "}
              {user ? (
                <Text numberOfLines={1} ellipsizeMode="tail">
                  {user.firstName} ✋🏻
                </Text>
              ) : (
                t("Dashboard.loading")
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("PublicForum" as any);
            }}
            className="ml-auto mr-4 mt-5"
          >
            <MaterialCommunityIcons
              name="message-processing"
              size={34}
              color="black"
            />
          </TouchableOpacity>
        </View>

        <View></View>
        <ScrollView 
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
            />
          }
        >
          <View
            style={{
              marginLeft: 20,
              marginTop: 60,
            }}
          >
            <Text
              style={{
                fontSize: dynamicStyles.slideShowTitleSize,
                color: "gray",
                marginBottom: 5,
              }}
            >
              {t("Dashboard.marketplace")}
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E2E2E2",
                marginRight: dynamicStyles.paddingTopSlideshow,
              }}
            />
          </View>

          <View
            style={{
              flex: 1,
              marginBottom: 10,
              justifyContent: "center",
              alignItems: "center",
              padding: 10,
            }}
          >
            <MarketPriceSlideShow language={language} />
          </View>

          <View
            style={{
              marginLeft: 20,
            }}
          >
            <Text
              style={{
                fontSize: dynamicStyles.slideShowTitleSize,
                color: "gray",
                marginBottom: 5,
              }}
            >
              {t("Dashboard.news")}
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E2E2E2",
                marginRight: dynamicStyles.paddingTopSlideshow,
              }}
            />
          </View>

          <View
            style={{
              flex: 1,
              padding: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <NewsSlideShow navigation={navigation} language={language} />
          </View>

          {/* <View
            className=""
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 25,
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={{
                borderRadius: 10,
                backgroundColor: "#26D041",
                width: dynamicStyles.buttonWidth,
                height: dynamicStyles.buttonHeight,
                marginLeft: 20,
              }}
              onPress={() => {
                navigation.navigate("CurrentAssert");
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/Sales Performance.webp")}
                  style={{
                    width: dynamicStyles.iconSize,
                    height: dynamicStyles.iconSize,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 15,

                    color: "white",
                    fontSize: dynamicStyles.textSize,
                  }}
                >
                  {t("Dashboard.myassets")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                borderRadius: 10,
                backgroundColor: "#26D041",
                width: dynamicStyles.buttonWidth,
                height: dynamicStyles.buttonHeight,
                marginRight: 20,
              }}
              onPress={handleWeatherNavigation}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 10,
                }}
              >
                <Image
                  source={require("../assets/images/whether fill w.webp")}
                  style={{
                    width: dynamicStyles.iconSize,
                    height: dynamicStyles.iconSize,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 5,
                    color: "white",
                    fontSize: dynamicStyles.textSize,
                  }}
                >
                  {t("Dashboard.weather")}
                </Text>
              </View>
            </TouchableOpacity>
          </View> */}
          <View
            className=""
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 25,
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={{
                borderRadius: 10,
                boxShadow: "0px 0px 10px #445F4A33",
                width: dynamicStyles.buttonWidth,
                height: dynamicStyles.buttonHeight,
                marginLeft: 20,
              }}
              onPress={() => {
                navigation.navigate("CurrentAssert");
              }}
            >
              <View
              className="flex-1 justify-center items-center "
    
              >
                <Image
                  source={require("../assets/images/assets.webp")}
                  style={{
                    width: dynamicStyles.iconSize,
                    height: dynamicStyles.iconSize,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: dynamicStyles.textSize,
                  }}
                >
                  {t("Dashboard.myassets")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                borderRadius: 10,
                boxShadow: "0px 0px 10px #445F4A33",
                width: dynamicStyles.buttonWidth,
                height: dynamicStyles.buttonHeight,
                marginRight: 20,
              }}
              onPress={handleWeatherNavigation}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 10,
                }}
              >
                <Image
                  source={require("../assets/images/weather.webp")}
                  style={{
                    width: dynamicStyles.iconSize,
                    height: dynamicStyles.iconSize,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: dynamicStyles.textSize,
                  }}
                >
                  {t("Dashboard.weather")}
                </Text>
              </View>
              
            </TouchableOpacity>
            
          </View>

          <View
            className=""
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 25,
              marginTop: 5,
            }}
          >
            <TouchableOpacity
              style={{
                borderRadius: 10,
                boxShadow: "0px 0px 10px #445F4A33",
                width: dynamicStyles.buttonWidth,
                height: dynamicStyles.buttonHeight,
                marginLeft: 20,
                marginBottom: 60,
              }}
              onPress={() => {
                navigation.navigate("TransactionHistory" as any);
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../assets/images/Transaction.webp")}
                  style={{
                    width: dynamicStyles.iconSize,
                    height: dynamicStyles.iconSize,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: dynamicStyles.textSize,
                  }}
                >
                  {t("TransactionList.Transactions")}
                </Text>
              </View>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Dashboard;
