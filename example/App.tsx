import { useAppIcon } from 'expo-runtime-app-icon';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const { icon, availableIcons, setIcon, isChanging, error } = useAppIcon();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Dynamic App Icon Example</Text>
        <Group name="Current icon">
          <Text>{icon ?? 'Default'}</Text>
        </Group>
        <Group name="Available icons">
          <Button title="Default" disabled={isChanging} onPress={() => setIcon(null)} />
          {availableIcons.map((name) => (
            <Button
              key={name}
              title={name}
              disabled={isChanging}
              onPress={() => setIcon(name)}
            />
          ))}
        </Group>
        {error && (
          <Group name="Error">
            <Text style={{ color: 'red' }}>{error.message}</Text>
          </Group>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: { fontSize: 30, margin: 20 },
  groupHeader: { fontSize: 20, marginBottom: 20 },
  group: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  container: { flex: 1, backgroundColor: '#eee' },
  view: { flex: 1, height: 200 },
};
