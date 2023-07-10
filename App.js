import React, { useState, useEffect, useRef } from 'react';
import { TextInput, TouchableWithoutFeedback, Text, View, LogBox, ScrollView, Pressable, Image, StyleSheet, TouchableOpacity, Keyboard} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Possible Unhandled Promise Rejection',
]);

const Stack = createNativeStackNavigator();
LogBox.ignoreLogs(['ViewPropTypes']);
const MyStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen name="Entry" component={EntryScreen} options={{ title: 'New Entry' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    // saving error
  }
}

const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
}

function getTrackerHue(mood, energy) {
  if (mood == '0') {
    if (energy == '0') return '#5587ab' //dblue
    if (energy == '1' || energy == '2') return '#87bbe0' //lblue
    if (energy == '3') return '#e39b49'//orange
    if (energy == '4' || energy == '5') return '#ab231f' //red
  } else if (mood == '1' || mood == '2') {
    if (energy == '0' || energy == '1' || energy == '2') return '#87bbe0'
    if (energy == '3') return '#e39b49'
    if (energy == '4' || energy == '5') return '#ab231f'
  } else if (mood == '3') {
    if (energy == '0' || energy == '1' || energy == '2' || energy == '3') return '#e39b49'
    if (energy == '4' || energy == '5') return '#f5c84c' //dyellow
  } else if (mood == '4') {
    if (energy == '0' || energy == '1' || energy == '2') return '#79b86c' //green
    if (energy == '3' || energy == '4' || energy == '5') return '#f5c84c'
  }
  else if (mood == '5') {
    if (energy == '0' || energy == '1' || energy == '2') return '#79b86c'
    if (energy == '3' || energy == '4') return '#f5c84c'
    if (energy == '5') return '#f5e464' //lyellow
  } else if (mood == '-1') return '#c9c8c7'
  else if (energy == '-1') return '#c9c8c7' //gr
}

function getSleepHue(sleep){
  if(sleep == '-1')  return '#c9c8c7'
  else return 'black'
}

const getDataForDateRange = async (dateRange) => {
  try {
    const keys = await getAllKeys();
    const dataMap = {};

    for (const key of keys) {
      if (dateRange.includes(key)) {
        const jsonValue = await AsyncStorage.getItem(key);
        dataMap[key] = jsonValue ? JSON.parse(jsonValue) : { mood: -1, energy: -1, sleep: -1, notes: "" };
      }
    }

    return dataMap;
  } catch (e) {
    console.error("Error reading values for date range", e);
  }
};

const getAllKeys = async () => {
  let keys = []
  try {
    keys = await AsyncStorage.getAllKeys()
  } catch (e) {
    // read key error
  }
  return keys;
}

const HomeScreen = ({ navigation }) => {
  const [mood, setMoodData] = useState([]);
  const [energy, setEnergyData] = useState([]);
  const [sleep, setSleepData] = useState([]);
  const [calendarDates, setCalendarDates] = useState([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  function getDaysArray(start, end) {
    for (var arr = [], dt = new Date(start); dt.setHours(0, 0, 0, 0) <= new Date(end).setHours(0, 0, 0, 0); dt.setDate(dt.getDate() + 1)) {
      arr.push(new Date(dt).toLocaleDateString());
    }
    return arr;
  }

  useFocusEffect(
    React.useCallback(() => {
      const getEntries = async () => {
        const rawKeys = await getAllKeys();
        const keys = rawKeys
          .map(key => new Date(key))
          .sort((a, b) => a - b)
          .map(date => date.toLocaleDateString())
        const moodEntries = [];
        const energyEntries = [];
        const sleepEntries = [];
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const datesArray = getDaysArray(keys[0], tomorrow.toLocaleDateString());
        const dataMap = await getDataForDateRange(datesArray);
        console.log(today.toLocaleDateString());
        const markedDates = {};

        for (let i = 0; i < datesArray.length; i++) {
          const value = dataMap[datesArray[i]] || { mood: -1, energy: -1, sleep: -1, notes: "" };
          markedDates[datesArray[i]] = {
            customStyles: {
              container: {
                backgroundColor: getTrackerHue(value.mood, value.energy),
              },
            },
          };
          moodEntries.push(
            <Pressable
              key={datesArray[i] + "mood"}
              title=""
              onPress={() =>
                navigation.navigate("Entry", {
                  initialDate: new Date(datesArray[i] + "T00:00:00"),
                })
              }
              style={{
                width: 25,
                height: (value.mood + 2) * 10,
                backgroundColor: getTrackerHue(value.mood, value.energy),
                marginRight: 10,
                borderRadius:10
              }}
            />
          );

          energyEntries.push(
            <Pressable
              key={datesArray[i] + "energy"}
              title=""
              onPress={() =>
                navigation.navigate("Entry", {
                  initialDate: new Date(datesArray[i] + "T00:00:00"),
                })
              }
              style={{
                width: 25,
                height: (value.energy + 2) * 10,
                backgroundColor: getTrackerHue(value.mood, value.energy),
                marginRight: 10,
                borderRadius:10
              }}
            />
          );

          sleepEntries.push(
            <Pressable
              key={datesArray[i] + "sleep"}
              title=""
              onPress={() =>
                navigation.navigate("Entry", {
                  initialDate: new Date(datesArray[i] + "T00:00:00"),
                })
              }
              style={{
                width: 25,
                height: (value.sleep + 2) * 5,
                backgroundColor: getSleepHue(value.sleep),
                marginRight: 10,
                borderRadius:10
              }}
            />
          );

        }
        const onDayPressed = (day) => {
          if (new Date(day.dateString + "T00:00:00") <= new Date) {
            navigation.navigate("Entry", {
              initialDate: new Date(day.dateString + "T00:00:00"),
            })
          }
        };
        setCalendarDates(<View>
          <Calendar
            markingType={'custom'}
            markedDates={markedDates}
            onDayPress={onDayPressed}
          />
        </View>);
        setMoodData(moodEntries);
        setEnergyData(energyEntries);
        setSleepData(sleepEntries);
      };
      getEntries();
    }, [])
  );
  
  const scrollViewRef = useRef();
  return (
    <View>
      
      <Text style={{
        position: 'absolute',
        left: 10,
        top: 5
      }}>Mood</Text>
      <Text style={{
        position: 'absolute',
        left: 10,
        top: 100
      }}>Energy</Text>
      <Text style={{
        position: 'absolute',
        left: 10,
        top: 200
      }}>Sleep</Text>
      <View>
        <ScrollView contentContainerStyle={{
          alignItems: 'center',
          padding: 10
        }} horizontal={true} ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}>
          <View>

            <View style={{
              flexDirection: 'row', alignItems: 'center',
              padding: 10, height:100
            }}>{mood}</View>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              padding: 10, height:100
            }}>{energy}</View>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              padding: 10, height:100
            }}>{sleep}</View>
          </View>
        </ScrollView>
      </View>
      {calendarDates}
      <TouchableOpacity style={{backgroundColor: '#5587ab',
    borderWidth: 3, width:200,
     justifyContent: 'center', alignItems: 'center', alignSelf: 'center', margin:10, padding:10, borderRadius:10}} onPress={() => navigation.navigate('Entry', {
      initialDate: new Date
    })}><Text style={{color:"white", fontSize:24}}>add entry</Text></TouchableOpacity>
    </View>
  );
};

const EntryScreen = ({ route, navigation }) => {
  const { initialDate } = route.params;
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date(initialDate));
  const [show, setShow] = useState(true);
  const [dotCoordinates, setDotCoordinates] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData(new Date(initialDate).toLocaleDateString());
      setMood(data || data.mood !== undefined ? data.mood : -1)
      setEnergy(data || data.energy !== undefined ? data.energy : -1)
      setSleep(data || data.sleep !== undefined ? data.sleep : -1)
      setNotes(data || data.notes !== undefined ? data.notes : "")
    };
    fetchData();
  }, [initialDate]);

  const onDateChange = async (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    const keys = await getAllKeys();
    if (keys.includes(new Date(currentDate).toLocaleDateString())) {
      var data = await getData(new Date(currentDate).toLocaleDateString())
      setMood(data.mood !== undefined ? data.mood : -1)
      setEnergy(data.energy !== undefined ? data.energy : -1)
      setSleep(data.sleep !== undefined ? data.sleep : -1)
      setNotes(data.notes !== undefined ? data.notes : "")
    } else {
      setMood(-1);
      setEnergy(-1);
      setSleep(-1);
      setNotes("");
    }
  };

  const handleSubmit = async () => {
    await storeData(date.toLocaleDateString(), { mood, energy, sleep, notes }).then(
      console.log(await getAllKeys()))
  }

  const clearDay = () =>{
    setMood(-1)
    setEnergy(-1)
    setSleep(-1)
    setNotes(-1)
    handleSubmit()
  }
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        <Image
          style={{
            width: 300,
            height: 300,
          }}
          source={{
            uri: 'https://cdn.glitch.global/c1e8e5f1-e523-49a5-83f3-215e021d3fa2/574ADA3F-95FB-4E39-BB95-3261D55663F8.jpeg?v=1681766657356',
          }}
          resizeMode="contain"
        />

        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 300 300`}
        >
          <Circle
            cx={(mood * 45)}
            cy={(-energy * 45) + 255}
            r={10} // Dot radius
            fill="red" // Dot color
          />
        </Svg>
      </View>
      {show && (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <DateTimePicker
            value={date}
            mode="date"
            display={'calendar'}
            onChange={onDateChange}
            maximumDate={new Date}
            style={{ width: 125, height: 50 }}
          /></View>
      )}

      <Text>Mood: {mood}</Text>
      <Slider
        style={{ width: 300, height: 40 }}
        minimumValue={0}
        maximumValue={5}
        step={1}
        value={mood}
        onValueChange={(value) => { setMood(value)
          }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"

      />

      <Text>Energy: {energy}</Text>
      <Slider
        style={{ width: 300, height: 40 }}
        minimumValue={0}
        maximumValue={5}
        step={1}
        value={energy}
        onValueChange={(value) => { setEnergy(value) 
          }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />

      <Text>Sleep: {sleep}</Text>
      <Slider
        style={{ width: 300, height: 40 }}
        minimumValue={0}
        maximumValue={24}
        step={1}
        value={sleep}
        onValueChange={(value) => {setSleep(value) 
          }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <Text>Notes:</Text>
       <ScrollView style={{padding:15}}>
<TextInput
        style={{ height: 50, width:300, borderColor: 'gray', borderWidth: 1, padding: 5}}
        onChangeText={setNotes}
        value={notes}
        multiline
        placeholder="Notes about your day..."
      />

</ScrollView>
      <TouchableOpacity style={{backgroundColor: '#5587ab',
    borderWidth: 3,
    height: 50,
    width: 100, justifyContent: 'center', alignItems: 'center', margin:10}} onPress={handleSubmit}><Text style={{color:"white", fontWeight:'bold'}}>SAVE</Text></TouchableOpacity>
    <TouchableOpacity style={{backgroundColor: '#c9c8c7',
    borderWidth: 3,
    height: 40,
    width: 110, justifyContent: 'center', alignItems: 'center', borderRadius:10}} onPress={clearDay}><Text style={{color:"black"}}>CLEAR DAY</Text></TouchableOpacity>

    </View>
    </TouchableWithoutFeedback>
  );
};

export default MyStack;