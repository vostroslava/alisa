import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformProps {
    isRecording: boolean;
}

export const Waveform = ({ isRecording }: WaveformProps) => {
    const scaleAnims = useRef(Array(25).fill(0).map(() => new Animated.Value(1))).current;

    useEffect(() => {
        if (isRecording) {
            const animations = scaleAnims.map((anim, i) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: Math.random() * 1.5 + 0.5,
                            duration: 200 + Math.random() * 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 200 + Math.random() * 300,
                            useNativeDriver: true,
                        }),
                    ])
                );
            });
            animations.forEach(anim => anim.start());
        } else {
            scaleAnims.forEach(anim => {
                anim.stopAnimation();
                anim.setValue(1);
            });
        }
    }, [isRecording]);

    return (
        <View style={styles.container}>
            {scaleAnims.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.bar,
                        {
                            height: 30, // Base height
                            transform: [{ scaleY: anim }],
                            opacity: index % 2 === 0 ? 0.8 : 0.4
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        gap: 3,
    },
    bar: {
        width: 3,
        backgroundColor: '#000',
        borderRadius: 1.5,
    },
});
