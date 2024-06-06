import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from 'react-query';
import msgCommands from "@client/shared/msgCommands.mjs"

const queryClient = new QueryClient();

const fetchMessages = async () => {
    const res = await fetch('http://localhost:3001/messages');
    return res.json();
};

function App() {
    const queryClient = useQueryClient();
    const { data: messages = [], refetch } = useQuery('messages', fetchMessages);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === msgCommands.NEW_MESSAGE) {
                queryClient.setQueryData('messages', (old) => [...old, message.payload]);
            }
        };

        return () => ws.close();
    }, [queryClient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:3001/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newMessage }),
        });
        setNewMessage('');
        refetch();
    };

    return (
        <div className="App">
            <h1>Messages</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
            <ul>
                {messages.map((message) => (
                    <li key={message.id}>{message.text}</li>
                ))}
            </ul>
        </div>
    );
}

function RootApp() {
    return (
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    );
}

export default RootApp;
