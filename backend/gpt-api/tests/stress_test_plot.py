import matplotlib.pyplot as plt

# Datos de los tiempos (en segundos)
nous_hermes = [9.43, 9.73, 10.39, 9.73, 9.73, 9.73, 9.29, 9.75, 9.74, 9.79, 9.31, 9.75, 9.86, 9.56, 9.35, 9.41, 9.80, 9.84, 9.81, 9.82]
mistral_instruct = [10.05, 9.17, 9.61, 9.35, 9.08, 9.27, 9.19, 9.37, 9.44, 9.29, 9.22, 9.25, 9.56, 9.29, 11.41, 9.49, 9.40, 9.33, 9.43, 9.43]

plt.figure(figsize=(10, 5))
plt.plot(range(1, 21), nous_hermes, marker='o', color='#8e44ad', label='Nous Hermes 2 (Violeta)')
plt.plot(range(1, 21), mistral_instruct, marker='o', color='#27ae60', label='Mistral 7B Instruct (Verde)')
plt.xlabel('Prueba')
plt.ylabel('Tiempo de respuesta (s)')
plt.title('Tiempos de respuesta por prueba (GPU)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('stress_test_plot.png')
plt.show()
