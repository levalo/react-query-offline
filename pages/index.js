import axios from 'axios';
import { useState } from 'react';

import {
  useQuery,
  useQueryClient,
  useMutation
} from 'react-query'

export default function Index () {
  const queryClient = useQueryClient()
  const [ text, setText ] = useState('')

  const { status, data, error, isFetching } = useQuery(['todos'], async () => {
    const res = await axios.get('/api/data')
    return res.data
  })

  const addTodoMutation = useMutation(
    text => axios.post('/api/data', { text }),
    {
      // Optimistically update the cache value on mutate, but store
      // the old value and return it so that it's accessible in case of
      // an error
      onMutate: async text => {
        setText('')
        await queryClient.cancelQueries(['todos'])

        const previousValue = queryClient.getQueryData(['todos'])

        queryClient.setQueryData(['todos'], old => [...old, text])

        return previousValue
      },
      // On failure, roll back to the previous value
      onError: (err, variables, previousValue) =>
        queryClient.setQueryData(['todos'], previousValue),
      // After success or failure, refetch the todos query
      onSettled: () => {
        queryClient.invalidateQueries(['todos'])
      },
    }
  )

  return (
    <div>
      <h1>Todos </h1>
      <form onSubmit={e => {
          e.preventDefault()
          addTodoMutation.mutate(text)
        }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button>{addTodoMutation.isLoading ? 'Creating...' : 'Create'}</button>
      </form>
      <br />
      {status === 'loading' ? (
        'Loading...'
      ) : status === 'error' ? (
        error.message
      ) : (
        <>
          <ul>
            {data.map(datum => (
              <li key={datum}>{datum}</li>
            ))}
          </ul>
          <div>{isFetching ? 'Updating in background...' : ' '}</div>
        </>
      )}
    </div>
  );
}
