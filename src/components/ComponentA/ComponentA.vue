<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  message: string;
}

defineProps<Props>();

const cpt = ref<number>(0);

const handleClick = () => {
  console.log('clicked');
  cpt.value++;
};
</script>

<template>
  <div>
    Hello this is component A : {{ message }} - Click counter : {{ cpt }}
  </div>
  <button @click="handleClick">Increment counter</button>
</template>
