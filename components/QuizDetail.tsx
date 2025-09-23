  // React Imports
  import React, { useState } from 'react';
  import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  // Navigation Imports
  import { NativeStackScreenProps } from '@react-navigation/native-stack';
  import { PrepareStackParamList } from '../navigation/PrepareStack';
  // Firebase Imports
  import { auth } from '../firebaseConfig';
  // Service Imports
  import { checkAndAwardBadges } from '../services/badgeServices';
  import { getUserData, saveUserQuizResult } from '../services/userServices';
  // Icon Imports
  import BackButton from '../assets/icons/BackButton.svg';
  // Types Imports
  import { QuizQuestion, QuizOption } from '../types';
  // Lottie Animation Imports
  import LottieView from 'lottie-react-native';

  // Props type for navigation
  type Props = NativeStackScreenProps<PrepareStackParamList, 'QuizDetail'>;

  const QuizDetail = ({ route, navigation }: Props) => {
    // Get quiz through route parameters
    const { quiz } = route.params;

    // Get user (assert non-null)
    const user = auth.currentUser!;

    // States
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<{ [key: number]: string[] }>({});
    const [score, setScore] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showAnimation, setShowAnimation] = useState<boolean>(false);
    const [pointsAnimation] = useState(new Animated.Value(0)); // Controls opacity & position of points animation
    const [animationText, setAnimationText] = useState<string>('');

    // Get current question object based on index
    const currentQuestion = quiz.questions[currentIndex];

    // Function to select or deselect an option
    const toggleOption = (option: string) => {
      if (submitted) return; // Prevent changes after submission
      setSelectedOptions(prev =>
        prev.includes(option)
          ? prev.filter(o => o !== option) // Remove if already selected
          : [...prev, option] // Add if not selected
      );
    };

    // Save the selected options of the current question to the answers state
    const saveCurrentAnswer = () => {
      setAnswers(prev => ({
        ...prev,
        [currentIndex]: selectedOptions
      }));
    };

    // Navigate to next question
    const goToNext = () => {
      saveCurrentAnswer();
      if (currentIndex < quiz.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        const nextSelected = answers[currentIndex + 1] || [];
        setSelectedOptions(nextSelected);
      }
    };

    // Navigate to previous question
    const goToPrevious = () => {
      saveCurrentAnswer(); // Save current before moving
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        const prevSelected = answers[currentIndex - 1] || []; // Load previously selected, if any
        setSelectedOptions(prevSelected);
      }
    };

    // Submit the quiz and save to firestore
    const handleSubmit = async () => {
      saveCurrentAnswer();

      let correctCount = 0;

      // Combine all answers including current question's selections
      const allAnswers: { [key: number]: string[] } = {
        ...answers,
        [currentIndex]: selectedOptions
      };

      // Determine correct count
      quiz.questions.forEach((q: QuizQuestion, index: number) => {
        // Filter only the options where isCorrect is true
        // Map those options to their text (so we can just compare strings, not objects)
        // Sorth them alphabetically to ensure order doesn't matter
        const correctAnswers = q.options.filter((opt: QuizOption) => opt.isCorrect)
          .map((opt: QuizOption) => opt.text)
          .sort();

        // Get the user's selected answers for this question
        // If they didn't select any, fall back to empty array
        // Also sort the user's answers alphabetically
        const userAnswer = (allAnswers[index] || []).sort();

        // Compare correctAnswers and userAnswers
        if (JSON.stringify(correctAnswers) === JSON.stringify(userAnswer)) {
          // If they match increment the correct count
          correctCount++;
        }
      });

      // Save the full answer set and score states
      setScore(correctCount);
      setSubmitted(true);

      // Calculate percentage
      const percentage = Math.round((correctCount / quiz.questions.length) * 100);

      // Get user data
      const userData = await getUserData(user.uid);

      // Get previous attempt if exists
      const quizResults = userData?.quizResults || {};
      const prevResult = quizResults[quiz.id];

      // Case 1: User scores 100%
      if (percentage === 100) {
        // Set animation text based on quiz completion status in Firestore
        setAnimationText(prevResult?.isCompleted ? 'Perfect!' : 'Perfect! +25 points')
        setShowAnimation(true); // Show confetti animation
        pointsAnimation.setValue(0); // Reset points animation value
        // Start points animation
        Animated.timing(pointsAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start();

        // Save result to Firestore if quiz not previously completed
        if (!prevResult?.isCompleted) {
          await saveUserQuizResult(user.uid, quiz, percentage, true);
          checkAndAwardBadges(user.uid);
        }
      } else { // Case 2: User scores less than 100%
        if (!prevResult) { // If no prior attempt
          await saveUserQuizResult(user.uid, quiz, percentage, false);
        } else if (!prevResult.isCompleted && percentage > prevResult.score) { // User has prior attempt but current attempt score improved -> update
          await saveUserQuizResult(user.uid, quiz, percentage, false);
        } else { // Otherwise ignore
          console.log(`No update: lower score than previous attempt for quiz ${quiz.id}`);
        }
      }
    };

    return (
      <SafeAreaView className='flex-1'>
        {/* Top Navigation */}
        <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
          {/* Back Button (Left) */}
          <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
            <BackButton width={45} height={45} />
          </TouchableOpacity>
          {/* Absolutely centered title */}
          <View className="absolute left-0 right-0 items-center">
            <Text className="font-poppins-semibold text-white text-2xl">Quiz</Text>
          </View>
          {/* Spacer for alignment (Right) */}
          <View style={{ width: 45 }} />
        </View>
        {/* Confetti Animation & Points Animation */}
        {showAnimation && (
          <View className="absolute inset-0 justify-center items-center bg-black/50 z-50">
            {/* Confetti Animation */}
            <LottieView
              source={require('../assets/animations/successConfetti.json')}
              autoPlay
              loop={false}
              style={{
                width: '60%', // responsive width
                maxWidth: 300,
                aspectRatio: 1, // maintain square ratio
              }}
              onAnimationFinish={() => setShowAnimation(false)}
            />
            {/* Points Text */}
            <View className="absolute" style={{ top: '60%' }}>
              <Text className="font-bold text-xl text-yellow-400">
                {animationText} 
              </Text>
            </View>
          </View>
        )}
        {/* Quiz Section */}
        <View className='px-6 flex-1 mb-10'>
          {/* Quiz Card */}
          <View className='px-6 bg-white rounded-3xl py-6'>
            {/* Quiz Content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Question */}
              <Text className='font-poppins-semibold text-base mt-2 mb-4'>{currentQuestion.question}</Text>
              {/* Answer Options */}
              {currentQuestion.options.map((option: QuizOption, idx: number) => {
                const isSelected = selectedOptions.includes(option.text);
                const isCorrect = option.isCorrect;

                // Determine background & border color after submission
                let bgColor = 'bg-white';
                let borderColor = 'border-[#D9D9D9]';
                if (!submitted && isSelected) {
                  bgColor = 'bg-blue-100';
                  borderColor = 'border-blue-500';
                } else if (submitted) {
                  if (isSelected && isCorrect) {
                    bgColor = 'bg-[#DCFCE7]';
                    borderColor = 'border-[#17A34A]';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'bg-[#FEE2E2]';
                    borderColor = 'border-[#DC2626]';
                  }
                }
                return (
                  <View
                    key={idx}
                    className='mb-3'
                  >
                    {/* Option Button */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => toggleOption(option.text)}
                      className={`mb-2 flex-row justify-between px-4 py-3 rounded-xl border ${bgColor} ${borderColor}`}
                    >
                      {/* Option Text */}
                      <Text className="font-poppins-medium text-sm text-[#555D6A] flex-1 pr-3">
                        {option.text}
                      </Text>
                    </TouchableOpacity>
                    {/* Explanation (only after submission & if selected) */}
                    {submitted && isSelected && option.explanation && (
                      <View className={`px-3 py-2 ${isCorrect ? 'bg-[#CFFAED]' : 'bg-[#FCE5E8]'} rounded-xl`}>
                        <Text className='font-poppins-medium text-sm text-[#555D6A]'>{isCorrect ? 'Correct!' : 'Wrong!'} {option.explanation}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {/* Navigation Buttons & Progress */}
              <View>
                {/* Navigation Buttons */}
                <View className='flex-row justify-between mt-6'>
                  {/* Previous Button */}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`px-4 py-2 rounded-xl ${currentIndex === 0 ? 'bg-gray-300' : 'bg-blue-500'}`}
                  >
                    <Text className='text-white font-poppins-medium'>Previous</Text>
                  </TouchableOpacity>
                  {/* Next Button */}
                  {currentIndex < quiz.questions.length - 1 ? (
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={goToNext}
                      className='px-4 py-2 bg-blue-500 rounded-xl'
                    >
                      <Text className='text-white font-poppins-medium'>Next</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={handleSubmit}
                      className='px-4 py-2 bg-blue-500 rounded-xl'
                    >
                      <Text className='text-white font-poppins-medium'>Submit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* Progress text */}
                <Text className='text-center text-sm text-gray-500 mt-4'>
                  Question {currentIndex + 1} of {quiz.questions.length}
                </Text>
                {/* Score after submission */}
                {score !== null && (
                  <Text className='text-center text-base font-poppins-semibold text-green-600 mt-2'>
                    Score: {score} / {quiz.questions.length}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  export default QuizDetail;