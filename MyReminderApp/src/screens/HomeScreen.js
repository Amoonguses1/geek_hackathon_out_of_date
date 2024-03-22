import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Switch, Button } from 'react-native';
import { AntDesign, Octicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { loadNonCompletionTasks, deleteSelectedTask, changeTaskStatus, loadTask } from '../utils/TaskDatabase';
import { daysOfWeek } from '../utils/useTaskState';
import { SaveTaskNotification, cancelScheduledNotification } from '../utils/notification';
import { useUser } from '../utils/UserContext';

function HomeScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const { userId } = useUser();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks(userId);
      requestPermissionsAsync();
    });

    // ヘッダーにログアウトボタンを設定
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => {
            // ログアウト処理をここに書く
            Alert.alert('Logout', 'You have been logged out.', [
              { text: 'OK', onPress: () => navigation.navigate('Title') } // 'LoginScreen'は適宜変更してください
            ]);
          }}
          title="Logout"
          color="#000"
        />
      )
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
    if(newStatus) {
      try{
        await cancelScheduledNotification(String(id));
      } catch(error) {
        Alert.alert("Error", error.message);
      }
    } else {
      try {
        const task = await loadTask(id);
        if(task[0].isnotification){
          await SaveTaskNotification(task[0]);
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    }
    // Update task status
    values = [newStatus ? 1: 0, id];
    try {
      await changeTaskStatus(values);
      await loadTasks();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  const requestPermissionsAsync = async () => {
    const { granted } = await Notifications.getPermissionsAsync();
    if (granted) { return }
  
    await Notifications.requestPermissionsAsync();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <View>
              <Text style={styles.taskText}>{item.name}</Text>
              <Text>{`Time: ${item.starttime}`}</Text>
              
              <Text>{`Repeat: ${item.repeat ? daysOfWeek.filter((day, index) => item.repeatDay && item.repeatDay[index]).map((day, index) => daysOfWeek[index]).join('・') : 'No Repeat'}`}</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text>Status</Text>
              <Switch value={item.status ? true : false} onValueChange={(newValue) => statusUpdate(newValue, item.id)} />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('TaskUpdate', { updateTaskId: item.id})}>
              <AntDesign name="edit" size={24} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <AntDesign name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity 
        style={styles.taskList} 
        onPress={() => navigation.navigate('CompleteTaskList', { userId: userId })}
      >
        <Octicons name="tasklist" size={60} color="black" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('TaskDetail', { userId: userId })}
      >
        <AntDesign name="pluscircle" size={60} color="blue" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskText: {
    fontSize: 18,
  },
  addButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskList: {
    position: 'absolute',
    left: 30,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomeScreen;