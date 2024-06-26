import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Button,
  ImageBackground,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";

import {
  loadNonCompletionTasks,
  deleteSelectedTask,
  changeTaskStatus,
  loadTask,
} from "../utils/TaskDatabase";
import { daysOfWeek } from "../utils/useTaskState";
import {
  SaveTaskNotification,
  cancelScheduledNotification,
} from "../utils/notification";
import { useUser } from "../utils/UserContext";
import TaskListItem from "../styles/taskListItem";
import { updateCommitCount } from "../utils/CommitDataBase";

function HomeScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const { userId } = useUser();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTasks();
      requestPermissionsAsync();
    });

    // ヘッダーにログアウトボタンを設定
    navigation.setOptions({
      headerTitle: "Routine Timer", // ヘッダーの真ん中のタイトルを"Routine Timer"に変更する
      headerTitleStyle: {
        fontSize: 24, // ヘッダータイトルのフォントサイズを大きくする
      },
      headerLeft: null, // 戻るボタンのタイトルを非表示にする
      headerRight: () => (
        <Button
          onPress={() => {
            // ログアウト処理をここに書く
            Alert.alert("Logout", "You have been logged out.", [
              { text: "OK", onPress: () => navigation.navigate("Title") }, // 'LoginScreen'は適宜変更してください
            ]);
          }}
          title="Logout"
          color="#FFF" // ログアウトボタンの文字色を白に設定する
        />
      ),
    });

    return unsubscribe;
  }, [navigation, userId]);

  const loadTasks = async () => {
    try {
      const tasks = await loadNonCompletionTasks(userId);
      setTasks(tasks);
    } catch (error) {
      Alert.alert("Error loading tasks", error.message);
    }
  };

  const loadEmergencyTasks = async () => {
    try {
      const tasks = await loadNonCompletionTasks(userId);
      const newTasks = tasks.filter((task) => task.label & (1 << 1));
      setTasks(newTasks);
    } catch (error) {
      Alert.alert("Error loading tasks labeled emergency", error.message);
    }
  };

  const loadRoutineTasks = async () => {
    try {
      const tasks = await loadNonCompletionTasks(userId);
      const newTasks = tasks.filter((task) => task.label & 1);
      setTasks(newTasks);
    } catch (error) {
      Alert.alert("Error loading tasks labeled routine", error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteSelectedTask(id);
      await cancelScheduledNotification(String(id));
      await loadTasks();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const statusUpdate = async (newStatus, id) => {
    // Set notifications
    if (newStatus) {
      try {
        await cancelScheduledNotification(String(id));
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    } else {
      try {
        const task = await loadTask(id);
        if (task[0].isnotification) {
          await SaveTaskNotification(task[0]);
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    }
    // Update task status
    values = [newStatus ? 1 : 0, id];
    try {
      await changeTaskStatus(values);
      await loadTasks();
    } catch (error) {
      Alert.alert("Error", error.message);
    }

    // increment commit count
    const currentDate = new Date().toISOString().slice(0, 10);
    updateCommitCount(currentDate);
  };

  const requestPermissionsAsync = async () => {
    const { granted } = await Notifications.getPermissionsAsync();
    if (granted) {
      return;
    }

    await Notifications.requestPermissionsAsync();
  };

  return (
    <ImageBackground
      source={require("../../assets/timer.png")}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      {/* Your existing content here */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TaskListItem
            styles={styles}
            item={item}
            daysOfWeek={daysOfWeek}
            navigation={navigation}
            statusUpdate={statusUpdate}
            deleteTask={deleteTask}
          />
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => loadRoutineTasks()}
          style={[styles.button, styles.buttonBackground2]}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Routine</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => loadEmergencyTasks()}
          style={[styles.button, styles.buttonBackground1]}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Emergency</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("CompleteTaskList", { userId: userId })
        }
        style={[styles.button, styles.completeTasksButtonBase]}
      >
        <View style={styles.completeTasksButton}>
          <AntDesign name="check" size={40} color="white" />
          <Text style={styles.completeTasksText}>Completed Tasks</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("TaskDetail", { userId: userId })}
      >
        <AntDesign name="pluscircle" size={85} color="#2D3F45" />
      </TouchableOpacity>


    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  line: {
    borderBottomColor: "#B3B3B3",
    borderBottomWidth: 3,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#B3B3B3",
  },
  backgroundImage: {
    resizeMode: "contain",
    width: "100%",
    height: "180%",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 0,
  },
  taskText: {
    fontSize: 30,
    fontboldWeight: "bold",
  },
  addButton: {
    position: "absolute",
    right: 30,
    bottom: 30,
    alignItems: "center",
    justifyContent: "center",
    height: 85,
    width: 85,
    borderRadius: 60,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 0,
  },

  completeTasksButtonBase: {
    position: "absolute",
    left: 30,
    bottom: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 0,
    height: 50,
    width: 200,
    borderRadius: 30,
    backgroundColor: "#2D3F45",
  },
  completeTasksButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completeTasksText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  flatListContainer: {
    flexGrow: 1,
    marginTop: 5,
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  complete: {
    marginVertical: 10,
    alignItems: "center",
  },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
  },
  achivement: {
    position: "absolute",
    right: 30,
    bottom: 70,
    alignItems: "center",
    justifyContent: "center",
    height: 85, // 大きさを変更
    width: 85, // 大きさを変更
    borderRadius: 60, // 丸みを帯びた四角にする
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 0,
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    marginHorizontal: 20,
    marginLeft: 33,
    marginBottom: 90, // Decreased marginBottom to move the button container higher
  },

  button: {
    height: 50,
    width: 100, // ボタンの横幅を150に変更
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    marginBottom: 10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
    marginLeft: 5,
  },
  completeTasksButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completeTasksText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  buttonBackground1: {
    backgroundColor: "#A90000",
  },
  buttonBackground2: {
    backgroundColor: "#00A600",
  },
  buttonBackground3: {
    backgroundColor: "#2D3F45",
  },
});

export default HomeScreen;
